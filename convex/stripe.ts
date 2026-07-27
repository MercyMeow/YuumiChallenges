import { v } from 'convex/values';
import { mutation, type MutationCtx } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { canFinishStripeWebhookAttempt } from '../src/lib/stripe/webhook-lease';

const STRIPE_CHECKOUT_SESSION_TTL_MS = 30 * 60 * 1000;
const STRIPE_WEBHOOK_PROCESSING_LEASE_MS = 5 * 60 * 1000;
// Checkout records outlive Stripe's 30-day manual event replay window.
const STRIPE_CHECKOUT_RECORD_RETENTION_MS = 32 * 24 * 60 * 60 * 1000;
// Cancellation tombstones must outlive Checkout records so an old paid event
// cannot resurrect a subscription after its deletion event was pruned.
const STRIPE_WEBHOOK_EVENT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const STRIPE_RETENTION_DELETE_BATCH = 64;
const STRIPE_STALE_SESSION_BATCH = 32;

function requireBridgeSecret(secret: string): void {
  const expected = process.env.AUTH_BRIDGE_SECRET;
  if (!expected || secret !== expected) {
    throw new Error('Unauthorized bridge call');
  }
}

function randomToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hasActiveWebhookLease(
  ctx: MutationCtx,
  eventId: string,
  leaseToken: string
): Promise<boolean> {
  const event = await ctx.db
    .query('stripeWebhookEvents')
    .withIndex('by_eventId', (q) => q.eq('eventId', eventId))
    .unique();
  return Boolean(
    event &&
    canFinishStripeWebhookAttempt(event.status, event.leaseToken, leaseToken) &&
    (event.processingUntil ?? 0) > Date.now()
  );
}

// ---------- supporter subscription (Stripe webhook bridge) ----------

type SubscriptionTransition = {
  mode: 'extend' | 'end';
  stripeSubscriptionId: string;
  stripeCustomerId?: string;
  subscribedUntil: number;
  eventAt?: number;
};

async function applySubscriptionTransition(
  ctx: MutationCtx,
  user: Doc<'webUsers'>,
  transition: SubscriptionTransition
) {
  if (
    transition.eventAt !== undefined &&
    user.subEventAt !== undefined &&
    (transition.eventAt < user.subEventAt ||
      (transition.eventAt === user.subEventAt &&
        transition.mode === 'extend' &&
        user.subEventMode === 'end'))
  ) {
    return { applied: false as const, reason: 'stale' as const };
  }

  await ctx.db.patch(user._id, {
    subscribedUntil:
      transition.mode === 'extend'
        ? Math.max(user.subscribedUntil ?? 0, transition.subscribedUntil)
        : transition.subscribedUntil,
    stripeSubscriptionId: transition.stripeSubscriptionId,
    ...(transition.stripeCustomerId !== undefined
      ? { stripeCustomerId: transition.stripeCustomerId }
      : {}),
    ...(transition.eventAt !== undefined
      ? {
          subEventAt: transition.eventAt,
          subEventMode: transition.mode,
        }
      : {}),
  });
  return { applied: true as const, reason: 'applied' as const };
}

async function readSubscriptionUser(
  ctx: MutationCtx,
  stripeSubscriptionId: string
): Promise<Doc<'webUsers'> | null> {
  return await ctx.db
    .query('webUsers')
    .withIndex('by_stripeSubscriptionId', (q) =>
      q.eq('stripeSubscriptionId', stripeSubscriptionId)
    )
    .unique();
}

/** Apply a paid invoice only to the exact subscription already on the user. */
export const renewStripeSubscription = mutation({
  args: {
    secret: v.string(),
    eventId: v.string(),
    leaseToken: v.string(),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.optional(v.string()),
    subscribedUntil: v.number(),
    eventAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    requireBridgeSecret(args.secret);
    if (!(await hasActiveWebhookLease(ctx, args.eventId, args.leaseToken))) {
      return { applied: false as const, reason: 'stale_lease' as const };
    }
    const user = await readSubscriptionUser(ctx, args.stripeSubscriptionId);
    if (!user) {
      return { applied: false as const, reason: 'not_found' as const };
    }
    return await applySubscriptionTransition(ctx, user, {
      mode: 'extend',
      stripeSubscriptionId: args.stripeSubscriptionId,
      subscribedUntil: args.subscribedUntil,
      ...(args.stripeCustomerId !== undefined
        ? { stripeCustomerId: args.stripeCustomerId }
        : {}),
      ...(args.eventAt !== undefined ? { eventAt: args.eventAt } : {}),
    });
  },
});

/**
 * One-way compatibility transition for subscriptions created before local
 * subscription ids were stored. It can only fill an empty/same binding on the
 * user already associated with the immutable Stripe customer.
 */
export const migrateLegacyStripeSubscription = mutation({
  args: {
    secret: v.string(),
    eventId: v.string(),
    leaseToken: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    subscribedUntil: v.number(),
    eventAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    requireBridgeSecret(args.secret);
    if (!(await hasActiveWebhookLease(ctx, args.eventId, args.leaseToken))) {
      return { applied: false as const, reason: 'stale_lease' as const };
    }
    const user = await ctx.db
      .query('webUsers')
      .withIndex('by_stripeCustomerId', (q) =>
        q.eq('stripeCustomerId', args.stripeCustomerId)
      )
      .unique();
    if (
      !user ||
      (user.stripeSubscriptionId !== undefined &&
        user.stripeSubscriptionId !== args.stripeSubscriptionId)
    ) {
      return { applied: false as const, reason: 'not_found' as const };
    }
    return await applySubscriptionTransition(ctx, user, {
      mode: 'extend',
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      subscribedUntil: args.subscribedUntil,
      ...(args.eventAt !== undefined ? { eventAt: args.eventAt } : {}),
    });
  },
});

/** End only the exact subscription named by Stripe's deletion event. */
export const cancelStripeSubscription = mutation({
  args: {
    secret: v.string(),
    eventId: v.string(),
    leaseToken: v.string(),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.optional(v.string()),
    subscribedUntil: v.number(),
    eventAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    requireBridgeSecret(args.secret);
    if (!(await hasActiveWebhookLease(ctx, args.eventId, args.leaseToken))) {
      return { applied: false as const, reason: 'stale_lease' as const };
    }
    const user = await readSubscriptionUser(ctx, args.stripeSubscriptionId);
    if (!user) {
      return { applied: false as const, reason: 'not_found' as const };
    }
    return await applySubscriptionTransition(ctx, user, {
      mode: 'end',
      stripeSubscriptionId: args.stripeSubscriptionId,
      subscribedUntil: args.subscribedUntil,
      ...(args.stripeCustomerId !== undefined
        ? { stripeCustomerId: args.stripeCustomerId }
        : {}),
      ...(args.eventAt !== undefined ? { eventAt: args.eventAt } : {}),
    });
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

    // A completed Checkout can remain in provider-side asynchronous payment
    // processing after its original browser-session expiry. Do not permit a
    // second subscription while that payment can still succeed.
    const paymentPending = await ctx.db
      .query('stripeCheckoutSessions')
      .withIndex('by_userId_status_updatedAt', (q) =>
        q.eq('userId', args.userId).eq('status', 'payment_pending')
      )
      .order('desc')
      .first();
    if (paymentPending) {
      return {
        state: 'payment_pending' as const,
        idempotencyKey: paymentPending.idempotencyKey,
        returnTo: paymentPending.returnTo,
        checkoutUrl: null,
        stripeCustomerId: user.stripeCustomerId ?? null,
      };
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
    if (
      session.status === 'completed' ||
      session.status === 'expired' ||
      session.status === 'payment_pending'
    ) {
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
    eventId: v.string(),
    leaseToken: v.string(),
    stripeSessionId: v.string(),
    status: v.union(
      v.literal('completed'),
      v.literal('expired'),
      v.literal('payment_pending')
    ),
    stripeSubscriptionId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    subscribedUntil: v.optional(v.number()),
    eventAt: v.optional(v.number()),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    requireBridgeSecret(args.secret);
    if (!(await hasActiveWebhookLease(ctx, args.eventId, args.leaseToken))) {
      return { applied: false as const, reason: 'stale_lease' as const };
    }
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

    if (args.status === 'payment_pending') {
      if (session.status === 'completed') {
        return {
          applied: false as const,
          userId: session.userId,
          reason: 'already_completed' as const,
        };
      }
      await ctx.db.patch(session._id, {
        status: 'payment_pending',
        ...(args.stripeSubscriptionId !== undefined
          ? { stripeSubscriptionId: args.stripeSubscriptionId }
          : {}),
        updatedAt: args.now,
      });
      return {
        applied: true as const,
        userId: session.userId,
        reason: 'payment_pending' as const,
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
      user.stripeSubscriptionId !== args.stripeSubscriptionId
    ) {
      const currentCheckout = await ctx.db
        .query('stripeCheckoutSessions')
        .withIndex('by_stripeSubscriptionId', (q) =>
          q.eq('stripeSubscriptionId', user.stripeSubscriptionId)
        )
        .unique();
      // A Checkout-backed binding retains its creation ordering even after
      // the local entitlement horizon expires. Legacy bindings have no
      // Checkout row; keep those authoritative only while still active.
      const currentBindingIsNewer = currentCheckout
        ? currentCheckout.createdAt > session.createdAt ||
          (currentCheckout.createdAt === session.createdAt &&
            currentCheckout._creationTime > session._creationTime)
        : (user.subscribedUntil ?? 0) > args.now;
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
 * Compatibility path for Checkout sessions created before local Checkout
 * records and plan metadata existed. The signed Stripe session still carries
 * the original Convex user id, but this transition may only fill an
 * empty/same subscription binding and therefore cannot replace a newer one.
 */
export const settleLegacyStripeCheckout = mutation({
  args: {
    secret: v.string(),
    eventId: v.string(),
    leaseToken: v.string(),
    userId: v.id('webUsers'),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.optional(v.string()),
    subscribedUntil: v.number(),
    eventAt: v.optional(v.number()),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    requireBridgeSecret(args.secret);
    if (!(await hasActiveWebhookLease(ctx, args.eventId, args.leaseToken))) {
      return { applied: false as const, reason: 'stale_lease' as const };
    }
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { applied: false as const, reason: 'not_found' as const };
    }
    if (
      user.stripeSubscriptionId !== undefined &&
      user.stripeSubscriptionId !== args.stripeSubscriptionId
    ) {
      return { applied: false as const, reason: 'superseded' as const };
    }

    const deletion = await ctx.db
      .query('stripeWebhookEvents')
      .withIndex('by_objectId_type_lastReceivedAt', (q) =>
        q
          .eq('objectId', args.stripeSubscriptionId)
          .eq('type', 'customer.subscription.deleted')
      )
      .order('desc')
      .first();
    const deletedEventAt =
      deletion?.stripeCreatedAt ?? args.eventAt ?? args.now;
    const result = await applySubscriptionTransition(ctx, user, {
      mode: deletion ? 'end' : 'extend',
      stripeSubscriptionId: args.stripeSubscriptionId,
      ...(args.stripeCustomerId !== undefined
        ? { stripeCustomerId: args.stripeCustomerId }
        : deletion?.customerId !== undefined
          ? { stripeCustomerId: deletion.customerId }
          : {}),
      subscribedUntil: deletion
        ? (deletion.subscriptionEndAt ?? deletedEventAt)
        : args.subscribedUntil,
      ...(deletion
        ? { eventAt: deletedEventAt }
        : args.eventAt !== undefined
          ? { eventAt: args.eventAt }
          : {}),
    });
    if (!result.applied) {
      return result;
    }
    return {
      applied: true as const,
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

    if (existing.status === 'processed') {
      return { shouldProcess: false as const, duplicate: true as const };
    }
    if (
      existing.status === 'processing' &&
      (existing.processingUntil ?? 0) > args.now
    ) {
      return {
        shouldProcess: false as const,
        duplicate: false as const,
        inProgress: true as const,
      };
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
      ) ||
      (existing.processingUntil ?? 0) <= args.now
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
