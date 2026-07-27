import { v } from 'convex/values';
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { canFinishStripeWebhookAttempt } from '../src/lib/stripe/supporter';

// ============ DISCORD WEB AUTH, ACCOUNT LINKING & SUPPORTER SUBS ============
//
// Site-visitor accounts (Discord OAuth), separate from the admin `users`
// table. The Next.js routes under src/app/api/auth|stripe are the only
// callers of the bridge mutations; they authenticate with a shared secret
// (AUTH_BRIDGE_SECRET, set in BOTH the Next and Convex environments)
// because the Convex HTTP client cannot call internal functions.
//
// Riot account linking is icon-verified: we challenge the user to switch
// their summoner icon to a starter icon (ids 0-29 — owned by every
// account) that is never the icon they currently wear, then re-fetch the
// summoner to confirm. Only a verified link earns the Supporter badge and
// auto-refresh on that profile.

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
// Active sessions kept per user (newest wins); bounds both storage growth
// and the per-login cleanup scan.
const MAX_ACTIVE_SESSIONS = 10;
const LINK_CHALLENGE_TTL_MS = 15 * 60 * 1000;
const STRIPE_CHECKOUT_SESSION_TTL_MS = 30 * 60 * 1000;
const STRIPE_WEBHOOK_PROCESSING_LEASE_MS = 5 * 60 * 1000;
// Starter summoner icons every account owns.
const STARTER_ICON_MAX = 29;

type StripeCheckoutStatus = 'pending' | 'open' | 'completed' | 'expired';
type StripeWebhookEventStatus = 'processing' | 'processed' | 'failed';

type StripeCheckoutSessionDoc = {
  _id: string;
  userId: Id<'webUsers'>;
  returnTo: string;
  status: StripeCheckoutStatus;
  idempotencyKey: string;
  stripeSessionId?: string;
  stripeSubscriptionId?: string;
  checkoutUrl?: string;
  expiresAt?: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
};

type StripeWebhookEventDoc = {
  _id: string;
  eventId: string;
  type: string;
  status: StripeWebhookEventStatus;
  stripeCreatedAt?: number;
  processingUntil?: number;
  lastReceivedAt: number;
  processedAt?: number;
  attemptCount: number;
  leaseToken?: string;
  customerId?: string;
  objectId?: string;
  lastError?: string;
};

type UntypedIndexRange = {
  eq(field: string, value: unknown): unknown;
};

const STRIPE_CHECKOUT_SESSIONS_TABLE = 'stripeCheckoutSessions' as never;
const STRIPE_WEBHOOK_EVENTS_TABLE = 'stripeWebhookEvents' as never;

function requireBridgeSecret(secret: string): void {
  const expected = process.env.AUTH_BRIDGE_SECRET;
  if (!expected || secret !== expected) {
    throw new Error('Unauthorized bridge call');
  }
}

function randomToken(): string {
  // 128 bits, hex — matches the admin-auth session token strength.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function byField(field: string, value: unknown): never {
  return ((q: UntypedIndexRange) => q.eq(field, value)) as never;
}

function untypedWrite<T extends object>(value: T): never {
  return value as unknown as never;
}

// ---------- session plumbing ----------

export const resolveUser = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, args): Promise<Doc<'webUsers'> | null> => {
    const session = await ctx.db
      .query('webSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique();
    if (!session || session.expiresAt < Date.now()) return null;
    return await ctx.db.get(session.userId);
  },
});

/**
 * Bridge (Discord OAuth callback): upsert the Discord user and mint a web
 * session. Returns the session token for the httpOnly cookie.
 */
export const upsertDiscordUser = mutation({
  args: {
    secret: v.string(),
    discordId: v.string(),
    username: v.string(),
    globalName: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireBridgeSecret(args.secret);
    const now = Date.now();
    const existing = await ctx.db
      .query('webUsers')
      .withIndex('by_discordId', (q) => q.eq('discordId', args.discordId))
      .unique();
    // The OAuth identity is authoritative: absent optional fields are
    // cleared (patching undefined removes them), so removed avatars or
    // global names don't linger.
    const profile = {
      username: args.username,
      globalName: args.globalName,
      avatar: args.avatar,
      lastLoginAt: now,
    };
    const userId = existing
      ? (await ctx.db.patch(existing._id, profile), existing._id)
      : await ctx.db.insert('webUsers', {
          discordId: args.discordId,
          createdAt: now,
          username: args.username,
          lastLoginAt: now,
          // Insert can't take explicit undefined (exactOptionalPropertyTypes)
          // — absent means absent on a fresh row anyway.
          ...(args.globalName !== undefined
            ? { globalName: args.globalName }
            : {}),
          ...(args.avatar !== undefined ? { avatar: args.avatar } : {}),
        });
    // Session hygiene: prune expired sessions and cap actives at
    // MAX_ACTIVE_SESSIONS (oldest-expiring dropped first). The cleanup
    // walks the user's whole session set in 250-row pages: every page
    // deletes all rows it read except the kept handful, so the loop
    // strictly shrinks and exits once a short page proves the set is
    // fully examined. The pass bound keeps worst-case deletes (~2k)
    // inside a mutation's write budget — far beyond any pile the cap
    // itself allows to accumulate.
    for (let pass = 0; pass < 8; pass++) {
      const sessions = await ctx.db
        .query('webSessions')
        .withIndex('by_userId', (q) => q.eq('userId', userId))
        .take(250);
      const active = [];
      for (const session of sessions) {
        if (session.expiresAt < now) {
          await ctx.db.delete(session._id);
        } else {
          active.push(session);
        }
      }
      if (active.length >= MAX_ACTIVE_SESSIONS) {
        active.sort((a, b) => b.expiresAt - a.expiresAt);
        for (const session of active.slice(MAX_ACTIVE_SESSIONS - 1)) {
          await ctx.db.delete(session._id);
        }
      }
      if (sessions.length < 250) break; // whole set examined
    }
    const token = randomToken();
    await ctx.db.insert('webSessions', {
      userId,
      token,
      expiresAt: now + SESSION_TTL_MS,
      createdAt: now,
    });
    return { token, expiresAt: now + SESSION_TTL_MS };
  },
});

/** Current web user for a session token (or null). Safe for clients. */
export const me = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('webSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique();
    if (!session || session.expiresAt < Date.now()) return null;
    const user = await ctx.db.get(session.userId);
    if (!user) return null;
    const now = Date.now();
    return {
      id: user._id,
      discordId: user.discordId,
      username: user.username,
      globalName: user.globalName ?? null,
      avatar: user.avatar ?? null,
      subscribed: (user.subscribedUntil ?? 0) > now,
      subscribedUntil: user.subscribedUntil ?? null,
      linkedPuuid: user.linkedPuuid ?? null,
      pendingLink:
        user.pendingLink && user.pendingLink.expiresAt > now
          ? user.pendingLink
          : null,
    };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('webSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique();
    if (session) await ctx.db.delete(session._id);
  },
});

// ---------- supporter subscription (Stripe webhook bridge) ----------

/**
 * Bridge (Stripe routes): stamp subscription state. Accepts either the
 * Convex user id (checkout completion, via client_reference_id) or the
 * Stripe customer id (renewals/cancellations).
 */
export const applySubscription = mutation({
  args: {
    secret: v.string(),
    userId: v.optional(v.id('webUsers')),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    subscribedUntil: v.number(),
    // 'extend' never shortens an existing entitlement (max of old/new), so
    // out-of-order or replayed payment webhooks are harmless; 'end' stamps
    // the supplied timestamp exactly (cancellation).
    mode: v.union(v.literal('extend'), v.literal('end')),
    // Stripe event creation time (ms). Events older than the newest one
    // already applied are dropped, so a delayed payment webhook can't
    // resurrect access after a cancellation.
    eventAt: v.optional(v.number()),
    setCustomerId: v.optional(v.string()),
    setSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireBridgeSecret(args.secret);
    let user: Doc<'webUsers'> | null = null;
    if (args.userId) {
      user = await ctx.db.get(args.userId);
    } else if (args.stripeSubscriptionId) {
      user = await ctx.db
        .query('webUsers')
        .withIndex('by_stripeSubscriptionId', (q) =>
          q.eq('stripeSubscriptionId', args.stripeSubscriptionId)
        )
        .unique();
    } else if (args.stripeCustomerId) {
      user = await ctx.db
        .query('webUsers')
        .withIndex('by_stripeCustomerId', (q) =>
          q.eq('stripeCustomerId', args.stripeCustomerId)
        )
        .unique();
    }
    if (!user) {
      return { applied: false as const, reason: 'not_found' as const };
    }
    const eventSubscriptionId =
      args.setSubscriptionId ?? args.stripeSubscriptionId;
    const appliesToCurrentSubscription =
      eventSubscriptionId === undefined ||
      eventSubscriptionId === user.stripeSubscriptionId;
    if (
      appliesToCurrentSubscription &&
      args.eventAt !== undefined &&
      user.subEventAt !== undefined
    ) {
      // Ordering guard: drop events older than the newest applied one.
      // Stripe's Event.created has second resolution, so a payment and a
      // cancellation can share a timestamp — cancellation wins the tie
      // (an entitlement must never be resurrected by an equal-aged
      // payment event). A newly paid replacement subscription is a separate
      // ordering stream and must not be blocked by the old subscription's
      // cancellation timestamp.
      if (args.eventAt < user.subEventAt) {
        return { applied: false as const, reason: 'stale' as const };
      }
      if (
        args.eventAt === user.subEventAt &&
        args.mode === 'extend' &&
        user.subEventMode === 'end'
      ) {
        return { applied: false as const, reason: 'stale' as const };
      }
    }
    const subscribedUntil =
      args.mode === 'extend'
        ? Math.max(user.subscribedUntil ?? 0, args.subscribedUntil)
        : args.subscribedUntil;
    await ctx.db.patch(user._id, {
      subscribedUntil,
      ...(args.eventAt !== undefined
        ? { subEventAt: args.eventAt, subEventMode: args.mode }
        : {}),
      ...(args.setCustomerId !== undefined
        ? { stripeCustomerId: args.setCustomerId }
        : {}),
      ...(args.setSubscriptionId !== undefined
        ? { stripeSubscriptionId: args.setSubscriptionId }
        : {}),
    });
    return { applied: true as const, reason: 'applied' as const };
  },
});

/**
 * Bridge (Stripe checkout route): create or reuse the single active
 * Checkout intent for a user. The stored idempotency key is reused across
 * retries so a timeout or double-click cannot fan out into parallel Stripe
 * subscription sessions.
 */
export const prepareStripeCheckout = mutation({
  args: {
    secret: v.string(),
    userId: v.id('webUsers'),
    returnTo: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    requireBridgeSecret(args.secret);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');
    if ((user.subscribedUntil ?? 0) > args.now) {
      return { state: 'already_subscribed' as const };
    }

    const sessions = (await (ctx.db
      .query(STRIPE_CHECKOUT_SESSIONS_TABLE)
      .withIndex('by_userId' as never, byField('userId', args.userId))
      .collect() as Promise<
      StripeCheckoutSessionDoc[]
    >)) as StripeCheckoutSessionDoc[];

    const ordered = sessions.sort((a, b) => b.updatedAt - a.updatedAt);
    for (const session of ordered) {
      const expiresAt = session.expiresAt ?? 0;
      const stalePending =
        session.status === 'pending' &&
        session.updatedAt + STRIPE_CHECKOUT_SESSION_TTL_MS <= args.now;
      const expiredOpen =
        session.status === 'open' && expiresAt > 0 && expiresAt <= args.now;
      if (stalePending || expiredOpen) {
        await ctx.db.patch(
          session._id as never,
          untypedWrite({
            status: 'expired',
            updatedAt: args.now,
          })
        );
        session.status = 'expired';
      }
    }

    const reusable = ordered.find((session) => {
      if (session.status === 'open') {
        return Boolean(
          session.checkoutUrl &&
          session.expiresAt !== undefined &&
          session.expiresAt > args.now
        );
      }
      return (
        session.status === 'pending' &&
        session.updatedAt + STRIPE_CHECKOUT_SESSION_TTL_MS > args.now
      );
    });

    if (reusable) {
      return {
        state: 'reuse' as const,
        idempotencyKey: reusable.idempotencyKey,
        returnTo: reusable.returnTo,
        checkoutUrl: reusable.checkoutUrl ?? null,
        stripeCustomerId: user.stripeCustomerId ?? null,
      };
    }

    const idempotencyKey = `stripe_checkout_${args.userId}_${randomToken()}`;
    await ctx.db.insert(
      STRIPE_CHECKOUT_SESSIONS_TABLE,
      untypedWrite({
        userId: args.userId,
        returnTo: args.returnTo,
        status: 'pending',
        idempotencyKey,
        createdAt: args.now,
        updatedAt: args.now,
      })
    );
    return {
      state: 'create' as const,
      idempotencyKey,
      returnTo: args.returnTo,
      checkoutUrl: null,
      stripeCustomerId: user.stripeCustomerId ?? null,
    };
  },
});

/** Bridge (Stripe checkout route): persist the reusable Checkout session. */
export const completeStripeCheckout = mutation({
  args: {
    secret: v.string(),
    userId: v.id('webUsers'),
    idempotencyKey: v.string(),
    checkoutUrl: v.string(),
    stripeSessionId: v.string(),
    expiresAt: v.number(),
    stripeCustomerId: v.optional(v.string()),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    requireBridgeSecret(args.secret);
    const session = (await (ctx.db
      .query(STRIPE_CHECKOUT_SESSIONS_TABLE)
      .withIndex(
        'by_idempotencyKey' as never,
        byField('idempotencyKey', args.idempotencyKey)
      )
      .unique() as Promise<StripeCheckoutSessionDoc | null>)) as StripeCheckoutSessionDoc | null;
    if (!session || session.userId !== args.userId) {
      return { applied: false as const };
    }
    if (session.status === 'completed' || session.status === 'expired') {
      return { applied: false as const };
    }
    await ctx.db.patch(
      session._id as never,
      untypedWrite({
        status: 'open',
        checkoutUrl: args.checkoutUrl,
        stripeSessionId: args.stripeSessionId,
        expiresAt: args.expiresAt,
        lastError: undefined,
        updatedAt: args.now,
      })
    );
    const user = await ctx.db.get(args.userId);
    if (user && !user.stripeCustomerId && args.stripeCustomerId) {
      await ctx.db.patch(args.userId, {
        stripeCustomerId: args.stripeCustomerId,
      });
    }
    return { applied: true as const };
  },
});

/**
 * Bridge (Stripe checkout route): retain the same idempotency key after a
 * failed Stripe round-trip so the next retry can safely ask Stripe for the
 * same Checkout session instead of minting a parallel one.
 */
export const recordStripeCheckoutFailure = mutation({
  args: {
    secret: v.string(),
    userId: v.id('webUsers'),
    idempotencyKey: v.string(),
    error: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    requireBridgeSecret(args.secret);
    const session = (await (ctx.db
      .query(STRIPE_CHECKOUT_SESSIONS_TABLE)
      .withIndex(
        'by_idempotencyKey' as never,
        byField('idempotencyKey', args.idempotencyKey)
      )
      .unique() as Promise<StripeCheckoutSessionDoc | null>)) as StripeCheckoutSessionDoc | null;
    if (!session || session.userId !== args.userId) {
      return { applied: false as const };
    }
    await ctx.db.patch(
      session._id as never,
      untypedWrite({
        lastError: args.error,
        updatedAt: args.now,
      })
    );
    return { applied: true as const };
  },
});

/** Bridge (Stripe webhook route): mark a Checkout session as settled. */
export const settleStripeCheckout = mutation({
  args: {
    secret: v.string(),
    stripeSessionId: v.string(),
    status: v.union(v.literal('completed'), v.literal('expired')),
    stripeSubscriptionId: v.optional(v.string()),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    requireBridgeSecret(args.secret);
    const session = (await (ctx.db
      .query(STRIPE_CHECKOUT_SESSIONS_TABLE)
      .withIndex(
        'by_stripeSessionId' as never,
        byField('stripeSessionId', args.stripeSessionId)
      )
      .unique() as Promise<StripeCheckoutSessionDoc | null>)) as StripeCheckoutSessionDoc | null;
    if (!session) return { applied: false as const };
    // Paid fulfillment is the dominant terminal state. Stripe does not
    // guarantee webhook delivery order, so a delayed completion must be able
    // to replace an earlier expiry, while a late expiry can never replace a
    // completion.
    if (
      session.status === 'completed' ||
      (session.status === 'expired' && args.status === 'expired')
    ) {
      return {
        applied: session.status === args.status,
        userId: session.userId,
      };
    }
    await ctx.db.patch(
      session._id as never,
      untypedWrite({
        status: args.status,
        ...(args.stripeSubscriptionId !== undefined
          ? { stripeSubscriptionId: args.stripeSubscriptionId }
          : {}),
        updatedAt: args.now,
      })
    );
    return {
      applied: true as const,
      userId: session.userId,
    };
  },
});

/**
 * Bridge (Stripe webhook route): acquire the event-processing lease. The
 * database row is the dedupe source of truth, so duplicate deliveries and
 * replayed retries cannot apply the same Stripe event twice.
 */
export const beginStripeWebhookEvent = mutation({
  args: {
    secret: v.string(),
    eventId: v.string(),
    type: v.string(),
    now: v.number(),
    stripeCreatedAt: v.optional(v.number()),
    customerId: v.optional(v.string()),
    objectId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireBridgeSecret(args.secret);
    const leaseToken = randomToken();
    const existing = (await (ctx.db
      .query(STRIPE_WEBHOOK_EVENTS_TABLE)
      .withIndex('by_eventId' as never, byField('eventId', args.eventId))
      .unique() as Promise<StripeWebhookEventDoc | null>)) as StripeWebhookEventDoc | null;

    if (!existing) {
      await ctx.db.insert(
        STRIPE_WEBHOOK_EVENTS_TABLE,
        untypedWrite({
          eventId: args.eventId,
          type: args.type,
          status: 'processing',
          stripeCreatedAt: args.stripeCreatedAt,
          processingUntil: args.now + STRIPE_WEBHOOK_PROCESSING_LEASE_MS,
          lastReceivedAt: args.now,
          attemptCount: 1,
          leaseToken,
          ...(args.customerId !== undefined
            ? { customerId: args.customerId }
            : {}),
          ...(args.objectId !== undefined ? { objectId: args.objectId } : {}),
        })
      );
      return {
        shouldProcess: true as const,
        duplicate: false as const,
        leaseToken,
      };
    }

    if (
      existing.status === 'processed' ||
      (existing.status === 'processing' &&
        (existing.processingUntil ?? 0) > args.now)
    ) {
      return { shouldProcess: false as const, duplicate: true as const };
    }

    await ctx.db.patch(
      existing._id as never,
      untypedWrite({
        type: args.type,
        status: 'processing',
        stripeCreatedAt: args.stripeCreatedAt,
        processingUntil: args.now + STRIPE_WEBHOOK_PROCESSING_LEASE_MS,
        lastReceivedAt: args.now,
        attemptCount: existing.attemptCount + 1,
        leaseToken,
        lastError: undefined,
        ...(args.customerId !== undefined
          ? { customerId: args.customerId }
          : {}),
        ...(args.objectId !== undefined ? { objectId: args.objectId } : {}),
      })
    );
    return {
      shouldProcess: true as const,
      duplicate: false as const,
      leaseToken,
    };
  },
});

/** Bridge (Stripe webhook route): close out the event-processing lease. */
export const finishStripeWebhookEvent = mutation({
  args: {
    secret: v.string(),
    eventId: v.string(),
    leaseToken: v.string(),
    success: v.boolean(),
    now: v.number(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireBridgeSecret(args.secret);
    const existing = (await (ctx.db
      .query(STRIPE_WEBHOOK_EVENTS_TABLE)
      .withIndex('by_eventId' as never, byField('eventId', args.eventId))
      .unique() as Promise<StripeWebhookEventDoc | null>)) as StripeWebhookEventDoc | null;
    if (!existing) return { applied: false as const, stale: true as const };
    if (
      !canFinishStripeWebhookAttempt(
        existing.status,
        existing.leaseToken,
        args.leaseToken
      )
    ) {
      return { applied: false as const, stale: true as const };
    }

    await ctx.db.patch(
      existing._id as never,
      untypedWrite({
        status: args.success ? 'processed' : 'failed',
        leaseToken: undefined,
        processingUntil: undefined,
        processedAt: args.success ? args.now : undefined,
        lastReceivedAt: args.now,
        lastError: args.success ? undefined : args.error,
      })
    );
    return { applied: true as const, stale: false as const };
  },
});

/** Supporter badge for a profile: linked + active subscription. */
export const getSupporterBadge = query({
  args: { puuid: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('webUsers')
      .withIndex('by_linkedPuuid', (q) => q.eq('linkedPuuid', args.puuid))
      .first();
    return user ? (user.subscribedUntil ?? 0) > Date.now() : false;
  },
});

// ---------- Riot account linking (icon verification) ----------

export const getRosterEntryByPuuid = internalQuery({
  args: { puuid: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('yuumiRoster')
      .withIndex('by_puuid', (q) => q.eq('puuid', args.puuid))
      .unique();
  },
});

export const setPendingLink = internalMutation({
  args: {
    userId: v.id('webUsers'),
    pendingLink: v.object({
      puuid: v.string(),
      iconId: v.number(),
      expiresAt: v.number(),
    }),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.patch(args.userId, { pendingLink: args.pendingLink });
  },
});

export const completeLink = internalMutation({
  args: { userId: v.id('webUsers'), puuid: v.string() },
  handler: async (ctx, args): Promise<void> => {
    // One verified owner per profile: steal-proof — the icon challenge
    // proves control of the Riot account, so a re-link supersedes.
    const holders = await ctx.db
      .query('webUsers')
      .withIndex('by_linkedPuuid', (q) => q.eq('linkedPuuid', args.puuid))
      .collect();
    for (const holder of holders) {
      if (holder._id !== args.userId) {
        await ctx.db.patch(holder._id, { linkedPuuid: undefined });
      }
    }
    await ctx.db.patch(args.userId, {
      linkedPuuid: args.puuid,
      pendingLink: undefined,
    });
  },
});

export const unlinkAccount = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('webSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique();
    if (!session || session.expiresAt < Date.now()) {
      throw new Error('Not signed in');
    }
    await ctx.db.patch(session.userId, {
      linkedPuuid: undefined,
      pendingLink: undefined,
    });
  },
});

/** Riot summoner-v4 profile icon for a puuid on a platform host. */
async function fetchProfileIconId(
  platform: string,
  puuid: string
): Promise<number> {
  const key = process.env.RIOT_API_KEY;
  if (!key) throw new Error('RIOT_API_KEY is not set');
  if (!/^[a-z0-9]{2,4}$/i.test(platform)) {
    throw new Error('Invalid Riot platform');
  }
  const res = await fetch(
    `https://${platform.toLowerCase()}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`,
    { headers: { 'X-Riot-Token': key } }
  );
  if (!res.ok) throw new Error(`Riot summoner lookup failed (${res.status})`);
  const data = (await res.json()) as { profileIconId?: number };
  if (typeof data.profileIconId !== 'number') {
    throw new Error('Riot summoner payload missing profileIconId');
  }
  return data.profileIconId;
}

/**
 * Begin linking a ladder profile to the signed-in Discord user. Returns
 * the starter icon (0-29) the player must equip — chosen to never be the
 * icon the account currently wears.
 */
export const startAccountLink = action({
  args: { token: v.string(), puuid: v.string() },
  handler: async (
    ctx,
    args
  ): Promise<{ iconId: number; expiresAt: number }> => {
    const user = await ctx.runQuery(internal.webauth.resolveUser, {
      token: args.token,
    });
    if (!user) throw new Error('Not signed in');
    const player = await ctx.runQuery(internal.webauth.getRosterEntryByPuuid, {
      puuid: args.puuid,
    });
    if (!player) throw new Error('Player is not on the Yuumi ladder');

    const currentIcon = await fetchProfileIconId(player.platform, args.puuid);
    // Uniform pick over the starter icons minus the current one (when the
    // account already wears a starter icon).
    let iconId = Math.floor(Math.random() * STARTER_ICON_MAX); // 0..28
    if (iconId >= currentIcon) iconId += 1; // skip current, still 0..29
    if (currentIcon < 0 || currentIcon > STARTER_ICON_MAX) {
      iconId = Math.floor(Math.random() * (STARTER_ICON_MAX + 1)); // 0..29
    }

    const expiresAt = Date.now() + LINK_CHALLENGE_TTL_MS;
    await ctx.runMutation(internal.webauth.setPendingLink, {
      userId: user._id,
      pendingLink: { puuid: args.puuid, iconId, expiresAt },
    });
    return { iconId, expiresAt };
  },
});

/**
 * Confirm the pending link: the summoner icon must now match the
 * challenge icon. On success the profile is verified as owned.
 */
export const verifyAccountLink = action({
  args: { token: v.string() },
  handler: async (
    ctx,
    args
  ): Promise<
    | { linked: true }
    | {
        linked: false;
        reason: 'challenge_expired' | 'player_missing' | 'icon_mismatch';
      }
  > => {
    const user = await ctx.runQuery(internal.webauth.resolveUser, {
      token: args.token,
    });
    if (!user) throw new Error('Not signed in');
    const pending = user.pendingLink;
    if (!pending || pending.expiresAt < Date.now()) {
      return { linked: false, reason: 'challenge_expired' as const };
    }
    const player = await ctx.runQuery(internal.webauth.getRosterEntryByPuuid, {
      puuid: pending.puuid,
    });
    if (!player) return { linked: false, reason: 'player_missing' as const };
    const currentIcon = await fetchProfileIconId(
      player.platform,
      pending.puuid
    );
    if (currentIcon !== pending.iconId) {
      return { linked: false, reason: 'icon_mismatch' as const };
    }
    await ctx.runMutation(internal.webauth.completeLink, {
      userId: user._id,
      puuid: pending.puuid,
    });
    return { linked: true as const };
  },
});
