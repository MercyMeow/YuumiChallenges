import { v } from 'convex/values';
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import { internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';
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
// Checkout records outlive Stripe's 30-day manual event replay window.
const STRIPE_CHECKOUT_RECORD_RETENTION_MS = 32 * 24 * 60 * 60 * 1000;
// Cancellation tombstones must outlive Checkout records so an old paid event
// cannot resurrect a subscription after its deletion event was pruned.
const STRIPE_WEBHOOK_EVENT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const STRIPE_RETENTION_DELETE_BATCH = 64;
const STRIPE_STALE_SESSION_BATCH = 32;
// Starter summoner icons every account owns.
const STARTER_ICON_MAX = 29;

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

    // Opportunistic, bounded retention: every new intent removes a small
    // batch outside the Stripe replay window. Continued traffic therefore
    // converges on time-bounded storage without making this hot path scan.
    const oldSessions = await ctx.db
      .query('stripeCheckoutSessions')
      .withIndex('by_updatedAt', (q) =>
        q.lt('updatedAt', args.now - STRIPE_CHECKOUT_RECORD_RETENTION_MS)
      )
      .take(STRIPE_RETENTION_DELETE_BATCH);
    for (const session of oldSessions) {
      await ctx.db.delete(session._id);
    }

    // Close stale active candidates using bounded, status-specific indexes.
    // The active lookup below never loads terminal checkout history.
    const stalePending = await ctx.db
      .query('stripeCheckoutSessions')
      .withIndex('by_userId_status_updatedAt', (q) =>
        q
          .eq('userId', args.userId)
          .eq('status', 'pending')
          .lte('updatedAt', args.now - STRIPE_CHECKOUT_SESSION_TTL_MS)
      )
      .take(STRIPE_STALE_SESSION_BATCH);
    const expiredOpen = await ctx.db
      .query('stripeCheckoutSessions')
      .withIndex('by_userId_status_expiresAt', (q) =>
        q
          .eq('userId', args.userId)
          .eq('status', 'open')
          .lte('expiresAt', args.now)
      )
      .take(STRIPE_STALE_SESSION_BATCH);
    for (const session of [...stalePending, ...expiredOpen]) {
      await ctx.db.patch(session._id, {
        status: 'expired',
        updatedAt: args.now,
      });
    }

    const pending = await ctx.db
      .query('stripeCheckoutSessions')
      .withIndex('by_userId_status_updatedAt', (q) =>
        q
          .eq('userId', args.userId)
          .eq('status', 'pending')
          .gt('updatedAt', args.now - STRIPE_CHECKOUT_SESSION_TTL_MS)
      )
      .order('desc')
      .first();
    const open = await ctx.db
      .query('stripeCheckoutSessions')
      .withIndex('by_userId_status_expiresAt', (q) =>
        q
          .eq('userId', args.userId)
          .eq('status', 'open')
          .gt('expiresAt', args.now)
      )
      .order('desc')
      .first();
    const reusable =
      pending && open
        ? pending.updatedAt >= open.updatedAt
          ? pending
          : open
        : (pending ?? open);

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
    await ctx.db.insert('stripeCheckoutSessions', {
      userId: args.userId,
      returnTo: args.returnTo,
      status: 'pending',
      idempotencyKey,
      createdAt: args.now,
      updatedAt: args.now,
    });
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
    const session = await ctx.db
      .query('stripeCheckoutSessions')
      .withIndex('by_idempotencyKey', (q) =>
        q.eq('idempotencyKey', args.idempotencyKey)
      )
      .unique();
    if (!session || session.userId !== args.userId) {
      return { applied: false as const };
    }
    if (session.status === 'completed' || session.status === 'expired') {
      return { applied: false as const };
    }
    await ctx.db.patch(session._id, {
      status: 'open',
      checkoutUrl: args.checkoutUrl,
      stripeSessionId: args.stripeSessionId,
      expiresAt: args.expiresAt,
      lastError: undefined,
      updatedAt: args.now,
    });
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
    const session = await ctx.db
      .query('stripeCheckoutSessions')
      .withIndex('by_idempotencyKey', (q) =>
        q.eq('idempotencyKey', args.idempotencyKey)
      )
      .unique();
    if (!session || session.userId !== args.userId) {
      return { applied: false as const };
    }
    await ctx.db.patch(session._id, {
      lastError: args.error,
      updatedAt: args.now,
    });
    return { applied: true as const };
  },
});

/**
 * Bridge (Stripe webhook route): settle a Checkout session and, for paid
 * completion, bind its entitlement in the same transaction. The atomic write
 * closes the gap where two out-of-order completion workers could each observe
 * the pre-fulfillment user and let an older Checkout replace the newer one.
 */
export const settleStripeCheckout = mutation({
  args: {
    secret: v.string(),
    stripeSessionId: v.string(),
    status: v.union(v.literal('completed'), v.literal('expired')),
    stripeSubscriptionId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    subscribedUntil: v.optional(v.number()),
    eventAt: v.optional(v.number()),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    requireBridgeSecret(args.secret);
    const session = await ctx.db
      .query('stripeCheckoutSessions')
      .withIndex('by_stripeSessionId', (q) =>
        q.eq('stripeSessionId', args.stripeSessionId)
      )
      .unique();
    if (!session) {
      return {
        applied: false as const,
        reason: 'not_found' as const,
      };
    }

    if (args.status === 'expired') {
      // Paid fulfillment is the dominant terminal state. A late expiry never
      // replaces completion, while repeated expiry delivery is idempotent.
      if (session.status === 'completed') {
        return {
          applied: false as const,
          userId: session.userId,
          reason: 'already_completed' as const,
        };
      }
      if (session.status === 'expired') {
        return {
          applied: true as const,
          userId: session.userId,
          reason: 'already_expired' as const,
        };
      }
      await ctx.db.patch(session._id, {
        status: 'expired',
        updatedAt: args.now,
      });
      return {
        applied: true as const,
        userId: session.userId,
        reason: 'expired' as const,
      };
    }

    if (!args.stripeSubscriptionId || args.subscribedUntil === undefined) {
      throw new Error('Paid Checkout settlement is missing entitlement data');
    }
    if (
      session.stripeSubscriptionId !== undefined &&
      session.stripeSubscriptionId !== args.stripeSubscriptionId
    ) {
      return {
        applied: false as const,
        userId: session.userId,
        reason: 'subscription_mismatch' as const,
      };
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      return {
        applied: false as const,
        reason: 'user_not_found' as const,
      };
    }
    // Compare intent creation order when another Checkout is active. This
    // makes the newest intent win regardless of which completion mutation
    // reaches Convex first.
    if (
      user.stripeSubscriptionId !== undefined &&
      user.stripeSubscriptionId !== args.stripeSubscriptionId &&
      (user.subscribedUntil ?? 0) > args.now
    ) {
      const currentCheckout = await ctx.db
        .query('stripeCheckoutSessions')
        .withIndex('by_stripeSubscriptionId', (q) =>
          q.eq('stripeSubscriptionId', user.stripeSubscriptionId)
        )
        .unique();
      const currentBindingIsNewer =
        !currentCheckout ||
        currentCheckout.createdAt > session.createdAt ||
        (currentCheckout.createdAt === session.createdAt &&
          currentCheckout._creationTime > session._creationTime);
      if (currentBindingIsNewer) {
        return {
          applied: false as const,
          userId: session.userId,
          reason: 'superseded' as const,
        };
      }
    }

    // The deletion ledger is written before cancellation processing starts.
    // If cancellation raced ahead of initial binding, reconcile its exact end
    // state here instead of losing it as an unmatched webhook.
    const deletion = await ctx.db
      .query('stripeWebhookEvents')
      .withIndex('by_objectId_type_lastReceivedAt', (q) =>
        q
          .eq('objectId', args.stripeSubscriptionId)
          .eq('type', 'customer.subscription.deleted')
      )
      .order('desc')
      .first();
    const completionEventAt = args.eventAt ?? args.now;
    const deletedEventAt = deletion?.stripeCreatedAt ?? completionEventAt;
    const deletedUntil = deletion
      ? (deletion.subscriptionEndAt ?? deletedEventAt)
      : undefined;

    // A same-subscription cancellation remains terminal even if a completion
    // event is delivered later with the same or an older Stripe timestamp.
    const staleCompletion =
      user.stripeSubscriptionId === args.stripeSubscriptionId &&
      user.subEventAt !== undefined &&
      (completionEventAt < user.subEventAt ||
        (completionEventAt === user.subEventAt && user.subEventMode === 'end'));

    await ctx.db.patch(session._id, {
      status: 'completed',
      stripeSubscriptionId: args.stripeSubscriptionId,
      updatedAt: args.now,
    });
    if (staleCompletion && !deletion) {
      return {
        applied: false as const,
        userId: session.userId,
        reason: 'stale' as const,
      };
    }

    const mode = deletion ? ('end' as const) : ('extend' as const);
    await ctx.db.patch(user._id, {
      subscribedUntil:
        deletedUntil ??
        Math.max(user.subscribedUntil ?? 0, args.subscribedUntil),
      stripeSubscriptionId: args.stripeSubscriptionId,
      subEventAt: deletion ? deletedEventAt : completionEventAt,
      subEventMode: mode,
      ...(args.stripeCustomerId !== undefined
        ? { stripeCustomerId: args.stripeCustomerId }
        : deletion?.customerId !== undefined
          ? { stripeCustomerId: deletion.customerId }
          : {}),
    });
    return {
      applied: true as const,
      userId: session.userId,
      reason: deletion
        ? ('subscription_deleted' as const)
        : ('completed' as const),
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
    subscriptionEndAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    requireBridgeSecret(args.secret);
    const leaseToken = randomToken();
    // Bounded opportunistic retention. A 90-day dedupe window intentionally
    // exceeds Checkout-record retention so cancellation tombstones remain
    // available for every locally fulfillable delayed payment.
    const oldEvents = await ctx.db
      .query('stripeWebhookEvents')
      .withIndex('by_lastReceivedAt', (q) =>
        q.lt('lastReceivedAt', args.now - STRIPE_WEBHOOK_EVENT_RETENTION_MS)
      )
      .take(STRIPE_RETENTION_DELETE_BATCH);
    for (const event of oldEvents) {
      await ctx.db.delete(event._id);
    }

    const existing = await ctx.db
      .query('stripeWebhookEvents')
      .withIndex('by_eventId', (q) => q.eq('eventId', args.eventId))
      .unique();

    if (!existing) {
      await ctx.db.insert('stripeWebhookEvents', {
        eventId: args.eventId,
        type: args.type,
        status: 'processing',
        processingUntil: args.now + STRIPE_WEBHOOK_PROCESSING_LEASE_MS,
        lastReceivedAt: args.now,
        attemptCount: 1,
        leaseToken,
        ...(args.stripeCreatedAt !== undefined
          ? { stripeCreatedAt: args.stripeCreatedAt }
          : {}),
        ...(args.customerId !== undefined
          ? { customerId: args.customerId }
          : {}),
        ...(args.objectId !== undefined ? { objectId: args.objectId } : {}),
        ...(args.subscriptionEndAt !== undefined
          ? { subscriptionEndAt: args.subscriptionEndAt }
          : {}),
      });
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

    await ctx.db.patch(existing._id, {
      type: args.type,
      status: 'processing',
      stripeCreatedAt: args.stripeCreatedAt,
      processingUntil: args.now + STRIPE_WEBHOOK_PROCESSING_LEASE_MS,
      lastReceivedAt: args.now,
      attemptCount: existing.attemptCount + 1,
      leaseToken,
      lastError: undefined,
      ...(args.customerId !== undefined ? { customerId: args.customerId } : {}),
      ...(args.objectId !== undefined ? { objectId: args.objectId } : {}),
      ...(args.subscriptionEndAt !== undefined
        ? { subscriptionEndAt: args.subscriptionEndAt }
        : {}),
    });
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
    const existing = await ctx.db
      .query('stripeWebhookEvents')
      .withIndex('by_eventId', (q) => q.eq('eventId', args.eventId))
      .unique();
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

    await ctx.db.patch(existing._id, {
      status: args.success ? 'processed' : 'failed',
      leaseToken: undefined,
      processingUntil: undefined,
      processedAt: args.success ? args.now : undefined,
      lastReceivedAt: args.now,
      lastError: args.success ? undefined : args.error,
    });
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
