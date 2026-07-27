import { convexTest } from 'convex-test';
import { beforeEach, describe, expect, it } from 'vitest';
import { api } from './_generated/api';
import schema from './schema';
import { modules } from './test.setup';

const BRIDGE_SECRET = 'test-bridge-secret';
const WEBHOOK_LEASE = {
  eventId: 'evt_test_transition',
  leaseToken: 'test-transition-lease',
} as const;

beforeEach(() => {
  process.env.AUTH_BRIDGE_SECRET = BRIDGE_SECRET;
});

async function insertWebUser(
  t: ReturnType<typeof convexTest>,
  discordId = 'discord-user'
) {
  return await t.run(async (ctx) => {
    const now = 1_000;
    await ctx.db.insert('stripeWebhookEvents', {
      eventId: WEBHOOK_LEASE.eventId,
      type: 'test.transition',
      status: 'processing',
      processingUntil: Date.now() + 60_000,
      lastReceivedAt: Date.now(),
      attemptCount: 1,
      leaseToken: WEBHOOK_LEASE.leaseToken,
    });
    return await ctx.db.insert('webUsers', {
      discordId,
      username: 'supporter',
      createdAt: now,
      lastLoginAt: now,
    });
  });
}

describe('Stripe entitlement state', () => {
  it('binds and updates only the tracked subscription and keeps end-on-tie', async () => {
    const t = convexTest(schema, modules);
    const userId = await insertWebUser(t);

    await t.run(async (ctx) => {
      await ctx.db.patch(userId, {
        stripeCustomerId: 'cus_1',
        stripeSubscriptionId: 'sub_1',
        subscribedUntil: 10_000,
        subEventAt: 2_000,
        subEventMode: 'extend',
      });
    });

    await expect(
      t.mutation(api.stripe.renewStripeSubscription, {
        ...WEBHOOK_LEASE,
        secret: BRIDGE_SECRET,
        stripeSubscriptionId: 'sub_other',
        stripeCustomerId: 'cus_1',
        subscribedUntil: 20_000,
        eventAt: 3_000,
      })
    ).resolves.toEqual({ applied: false, reason: 'not_found' });

    await expect(
      t.mutation(api.stripe.cancelStripeSubscription, {
        ...WEBHOOK_LEASE,
        secret: BRIDGE_SECRET,
        stripeSubscriptionId: 'sub_1',
        subscribedUntil: 4_000,
        eventAt: 4_000,
      })
    ).resolves.toMatchObject({ applied: true });

    await expect(
      t.mutation(api.stripe.renewStripeSubscription, {
        ...WEBHOOK_LEASE,
        secret: BRIDGE_SECRET,
        stripeSubscriptionId: 'sub_1',
        subscribedUntil: 30_000,
        eventAt: 4_000,
      })
    ).resolves.toEqual({ applied: false, reason: 'stale' });

    const user = await t.run(async (ctx) => await ctx.db.get(userId));
    expect(user).toMatchObject({
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_1',
      subscribedUntil: 4_000,
      subEventAt: 4_000,
      subEventMode: 'end',
    });
  });

  it('does not let an old subscription cancellation block its replacement', async () => {
    const t = convexTest(schema, modules);
    const userId = await insertWebUser(t, 'replacement-user');

    await t.run(async (ctx) => {
      await ctx.db.patch(userId, {
        stripeSubscriptionId: 'sub_old',
        subscribedUntil: 10_000,
        subEventAt: 2_000,
        subEventMode: 'extend',
      });
    });
    await t.mutation(api.stripe.cancelStripeSubscription, {
      ...WEBHOOK_LEASE,
      secret: BRIDGE_SECRET,
      stripeSubscriptionId: 'sub_old',
      subscribedUntil: 4_000,
      eventAt: 4_000,
    });
    await t.run(async (ctx) => {
      await ctx.db.insert('stripeCheckoutSessions', {
        userId,
        returnTo: '/',
        status: 'open',
        idempotencyKey: 'replacement_checkout',
        stripeSessionId: 'cs_replacement',
        createdAt: 5_000,
        updatedAt: 5_000,
      });
    });

    await expect(
      t.mutation(api.stripe.settleStripeCheckout, {
        ...WEBHOOK_LEASE,
        secret: BRIDGE_SECRET,
        stripeSessionId: 'cs_replacement',
        stripeSubscriptionId: 'sub_new',
        subscribedUntil: 30_000,
        status: 'completed',
        eventAt: 3_000,
        now: 5_000,
      })
    ).resolves.toMatchObject({ applied: true });

    const user = await t.run(async (ctx) => await ctx.db.get(userId));
    expect(user).toMatchObject({
      stripeSubscriptionId: 'sub_new',
      subscribedUntil: 30_000,
      subEventAt: 3_000,
      subEventMode: 'extend',
    });
  });

  it('backfills a legacy subscription id through the existing customer', async () => {
    const t = convexTest(schema, modules);
    const userId = await insertWebUser(t, 'legacy-supporter');
    await t.run(async (ctx) => {
      await ctx.db.patch(userId, {
        stripeCustomerId: 'cus_legacy',
        subscribedUntil: 5_000,
      });
    });

    await expect(
      t.mutation(api.stripe.migrateLegacyStripeSubscription, {
        ...WEBHOOK_LEASE,
        secret: BRIDGE_SECRET,
        stripeCustomerId: 'cus_legacy',
        stripeSubscriptionId: 'sub_legacy',
        subscribedUntil: 20_000,
        eventAt: 6_000,
      })
    ).resolves.toEqual({ applied: true, reason: 'applied' });

    const user = await t.run(async (ctx) => await ctx.db.get(userId));
    expect(user).toMatchObject({
      stripeCustomerId: 'cus_legacy',
      stripeSubscriptionId: 'sub_legacy',
      subscribedUntil: 20_000,
    });
  });

  it('settles a predeployment Checkout without a local session record', async () => {
    const t = convexTest(schema, modules);
    const userId = await insertWebUser(t, 'predeployment-checkout-user');

    await expect(
      t.mutation(api.stripe.settleLegacyStripeCheckout, {
        ...WEBHOOK_LEASE,
        secret: BRIDGE_SECRET,
        userId,
        stripeCustomerId: 'cus_predeployment',
        stripeSubscriptionId: 'sub_predeployment',
        subscribedUntil: 20_000,
        eventAt: 6_000,
        now: 7_000,
      })
    ).resolves.toEqual({ applied: true, reason: 'completed' });

    const user = await t.run(async (ctx) => await ctx.db.get(userId));
    expect(user).toMatchObject({
      stripeCustomerId: 'cus_predeployment',
      stripeSubscriptionId: 'sub_predeployment',
      subscribedUntil: 20_000,
      subEventAt: 6_000,
    });
  });

  it('does not let a delayed legacy renewal overwrite a newer cancellation', async () => {
    const t = convexTest(schema, modules);
    const userId = await insertWebUser(t, 'legacy-cancelled-supporter');
    await t.run(async (ctx) => {
      await ctx.db.patch(userId, {
        stripeCustomerId: 'cus_legacy_cancelled',
        subscribedUntil: 7_000,
        subEventAt: 7_000,
        subEventMode: 'end',
      });
    });

    await expect(
      t.mutation(api.stripe.migrateLegacyStripeSubscription, {
        ...WEBHOOK_LEASE,
        secret: BRIDGE_SECRET,
        stripeCustomerId: 'cus_legacy_cancelled',
        stripeSubscriptionId: 'sub_legacy_cancelled',
        subscribedUntil: 20_000,
        eventAt: 6_000,
      })
    ).resolves.toEqual({ applied: false, reason: 'stale' });

    const user = await t.run(async (ctx) => await ctx.db.get(userId));
    expect(user).toMatchObject({
      stripeCustomerId: 'cus_legacy_cancelled',
      subscribedUntil: 7_000,
      subEventAt: 7_000,
      subEventMode: 'end',
    });
    expect(user?.stripeSubscriptionId).toBeUndefined();
  });

  it('rejects an entitlement transition from a superseded webhook lease', async () => {
    const t = convexTest(schema, modules);
    const userId = await insertWebUser(t, 'stale-lease-supporter');
    await t.run(async (ctx) => {
      await ctx.db.patch(userId, {
        stripeSubscriptionId: 'sub_stale_lease',
      });
      const event = await ctx.db
        .query('stripeWebhookEvents')
        .withIndex('by_eventId', (q) => q.eq('eventId', WEBHOOK_LEASE.eventId))
        .unique();
      await ctx.db.patch(event!._id, { leaseToken: 'new-owner' });
    });

    await expect(
      t.mutation(api.stripe.renewStripeSubscription, {
        ...WEBHOOK_LEASE,
        secret: BRIDGE_SECRET,
        stripeSubscriptionId: 'sub_stale_lease',
        subscribedUntil: 20_000,
      })
    ).resolves.toEqual({ applied: false, reason: 'stale_lease' });
  });

  it('does not use customer fallback to replace a different binding', async () => {
    const t = convexTest(schema, modules);
    const userId = await insertWebUser(t, 'bound-supporter');
    await t.run(async (ctx) => {
      await ctx.db.patch(userId, {
        stripeCustomerId: 'cus_bound',
        stripeSubscriptionId: 'sub_current',
        subscribedUntil: 50_000,
      });
    });

    await expect(
      t.mutation(api.stripe.migrateLegacyStripeSubscription, {
        ...WEBHOOK_LEASE,
        secret: BRIDGE_SECRET,
        stripeCustomerId: 'cus_bound',
        stripeSubscriptionId: 'sub_old',
        subscribedUntil: 60_000,
      })
    ).resolves.toEqual({ applied: false, reason: 'not_found' });
  });

  it('prevents an expired webhook worker from finishing a newer lease', async () => {
    const t = convexTest(schema, modules);
    const first = await t.mutation(api.stripe.beginStripeWebhookEvent, {
      secret: BRIDGE_SECRET,
      eventId: 'evt_lease',
      type: 'invoice.paid',
      now: 1_000,
    });
    expect(first.shouldProcess).toBe(true);

    const duplicate = await t.mutation(api.stripe.beginStripeWebhookEvent, {
      secret: BRIDGE_SECRET,
      eventId: 'evt_lease',
      type: 'invoice.paid',
      now: 2_000,
    });
    expect(duplicate).toMatchObject({
      shouldProcess: false,
      duplicate: false,
      inProgress: true,
    });

    const retry = await t.mutation(api.stripe.beginStripeWebhookEvent, {
      secret: BRIDGE_SECRET,
      eventId: 'evt_lease',
      type: 'invoice.paid',
      now: 5 * 60 * 1_000 + 1_001,
    });
    expect(retry.shouldProcess).toBe(true);
    expect(retry.leaseToken).not.toBe(first.leaseToken);

    await expect(
      t.mutation(api.stripe.finishStripeWebhookEvent, {
        secret: BRIDGE_SECRET,
        eventId: 'evt_lease',
        leaseToken: first.leaseToken!,
        success: false,
        error: 'late failure',
        now: 5 * 60 * 1_000 + 2_000,
      })
    ).resolves.toEqual({ applied: false, stale: true });

    await expect(
      t.mutation(api.stripe.finishStripeWebhookEvent, {
        secret: BRIDGE_SECRET,
        eventId: 'evt_lease',
        leaseToken: retry.leaseToken!,
        success: true,
        now: 5 * 60 * 1_000 + 2_001,
      })
    ).resolves.toEqual({ applied: true, stale: false });

    const event = await t.run(async (ctx) => {
      return await ctx.db
        .query('stripeWebhookEvents')
        .withIndex('by_eventId', (q) => q.eq('eventId', 'evt_lease'))
        .unique();
    });
    expect(event).toMatchObject({
      attemptCount: 2,
      status: 'processed',
    });
    expect(event?.leaseToken).toBeUndefined();
  });
});

describe('Stripe checkout intent reuse', () => {
  it('blocks a second Checkout while asynchronous payment is pending', async () => {
    const t = convexTest(schema, modules);
    const userId = await insertWebUser(t, 'async-payment-user');

    const first = await t.mutation(api.stripe.prepareStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      returnTo: '/',
      now: 1_000,
    });
    if (first.state !== 'create') {
      throw new Error('Expected a new checkout intent');
    }
    await t.mutation(api.stripe.completeStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      idempotencyKey: first.idempotencyKey,
      checkoutUrl: 'https://checkout.stripe.test/async',
      stripeSessionId: 'cs_async',
      expiresAt: 2_000,
      now: 1_500,
    });
    await t.mutation(api.stripe.settleStripeCheckout, {
      ...WEBHOOK_LEASE,
      secret: BRIDGE_SECRET,
      stripeSessionId: 'cs_async',
      stripeSubscriptionId: 'sub_async',
      status: 'payment_pending',
      now: 3_000,
    });

    await expect(
      t.mutation(api.stripe.prepareStripeCheckout, {
        secret: BRIDGE_SECRET,
        userId,
        returnTo: '/new',
        now: 4_000,
      })
    ).resolves.toMatchObject({
      state: 'payment_pending',
      idempotencyKey: first.idempotencyKey,
    });

    await t.mutation(api.stripe.settleStripeCheckout, {
      ...WEBHOOK_LEASE,
      secret: BRIDGE_SECRET,
      stripeSessionId: 'cs_async',
      status: 'expired',
      now: 5_000,
    });
    await expect(
      t.mutation(api.stripe.prepareStripeCheckout, {
        secret: BRIDGE_SECRET,
        userId,
        returnTo: '/retry',
        now: 6_000,
      })
    ).resolves.toMatchObject({ state: 'create', returnTo: '/retry' });
  });

  it('reuses the same checkout intent after a recorded provider failure', async () => {
    const t = convexTest(schema, modules);
    const userId = await insertWebUser(t, 'failed-checkout-user');

    const first = await t.mutation(api.stripe.prepareStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      returnTo: '/players/euw/example',
      now: 1_000,
    });
    expect(first.state).toBe('create');
    if (first.state !== 'create') {
      throw new Error('Expected a new checkout intent');
    }

    await expect(
      t.mutation(api.stripe.recordStripeCheckoutFailure, {
        secret: BRIDGE_SECRET,
        userId,
        idempotencyKey: first.idempotencyKey,
        error: 'Stripe request timed out',
        now: 2_000,
      })
    ).resolves.toEqual({ applied: true });

    const retry = await t.mutation(api.stripe.prepareStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      returnTo: '/ignored-on-retry',
      now: 3_000,
    });
    expect(retry).toMatchObject({
      state: 'reuse',
      idempotencyKey: first.idempotencyKey,
      returnTo: '/players/euw/example',
      checkoutUrl: null,
    });

    const sessions = await t.run(async (ctx) => {
      return await ctx.db
        .query('stripeCheckoutSessions')
        .withIndex('by_userId', (q) => q.eq('userId', userId))
        .collect();
    });
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      idempotencyKey: first.idempotencyKey,
      lastError: 'Stripe request timed out',
      status: 'pending',
    });
  });

  it('reuses one idempotency key and binds fulfillment to the stored user', async () => {
    const t = convexTest(schema, modules);
    const userId = await insertWebUser(t, 'checkout-user');

    const first = await t.mutation(api.stripe.prepareStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      returnTo: '/players/euw/example',
      now: 1_000,
    });
    expect(first.state).toBe('create');

    const pendingRetry = await t.mutation(api.stripe.prepareStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      returnTo: '/ignored-on-retry',
      now: 2_000,
    });
    expect(pendingRetry).toMatchObject({
      state: 'reuse',
      idempotencyKey: first.idempotencyKey,
      returnTo: '/players/euw/example',
      checkoutUrl: null,
    });

    await t.mutation(api.stripe.completeStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      idempotencyKey: first.idempotencyKey,
      checkoutUrl: 'https://checkout.stripe.test/session',
      stripeSessionId: 'cs_1',
      expiresAt: 100_000,
      now: 3_000,
    });

    const openRetry = await t.mutation(api.stripe.prepareStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      returnTo: '/another-path',
      now: 4_000,
    });
    expect(openRetry).toMatchObject({
      state: 'reuse',
      idempotencyKey: first.idempotencyKey,
      checkoutUrl: 'https://checkout.stripe.test/session',
    });

    const settled = await t.mutation(api.stripe.settleStripeCheckout, {
      ...WEBHOOK_LEASE,
      secret: BRIDGE_SECRET,
      stripeSessionId: 'cs_1',
      stripeSubscriptionId: 'sub_1',
      subscribedUntil: 5_500,
      status: 'completed',
      now: 5_000,
    });
    expect(settled).toEqual({
      applied: true,
      userId,
      reason: 'completed',
    });

    // Settlement and entitlement binding are atomic.
    const user = await t.run(async (ctx) => await ctx.db.get(userId));
    expect(user).toMatchObject({
      stripeSubscriptionId: 'sub_1',
      subscribedUntil: 5_500,
    });

    const lateExpiry = await t.mutation(api.stripe.settleStripeCheckout, {
      ...WEBHOOK_LEASE,
      secret: BRIDGE_SECRET,
      stripeSessionId: 'cs_1',
      status: 'expired',
      now: 6_000,
    });
    expect(lateExpiry).toEqual({
      applied: false,
      userId,
      reason: 'already_completed',
    });

    const second = await t.mutation(api.stripe.prepareStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      returnTo: '/players/euw/example',
      now: 7_000,
    });
    expect(second.state).toBe('create');
    if (second.state !== 'create') {
      throw new Error('Expected a second checkout intent');
    }
    await t.mutation(api.stripe.completeStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      idempotencyKey: second.idempotencyKey,
      checkoutUrl: 'https://checkout.stripe.test/delayed',
      stripeSessionId: 'cs_2',
      expiresAt: 100_000,
      now: 8_000,
    });
    await t.mutation(api.stripe.settleStripeCheckout, {
      ...WEBHOOK_LEASE,
      secret: BRIDGE_SECRET,
      stripeSessionId: 'cs_2',
      status: 'expired',
      now: 9_000,
    });
    const delayedCompletion = await t.mutation(
      api.stripe.settleStripeCheckout,
      {
        ...WEBHOOK_LEASE,
        secret: BRIDGE_SECRET,
        stripeSessionId: 'cs_2',
        stripeSubscriptionId: 'sub_2',
        subscribedUntil: 20_000,
        status: 'completed',
        now: 10_000,
      }
    );
    expect(delayedCompletion).toEqual({
      applied: true,
      userId,
      reason: 'completed',
    });

    const checkout = await t.run(async (ctx) => {
      return await ctx.db
        .query('stripeCheckoutSessions')
        .withIndex('by_stripeSessionId', (q) => q.eq('stripeSessionId', 'cs_2'))
        .unique();
    });
    expect(checkout?.status).toBe('completed');
  });

  it('rejects an expired older completion after a newer subscription is active', async () => {
    const t = convexTest(schema, modules);
    const userId = await insertWebUser(t, 'superseded-checkout-user');

    const oldIntent = await t.mutation(api.stripe.prepareStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      returnTo: '/old',
      now: 1_000,
    });
    if (oldIntent.state !== 'create') {
      throw new Error('Expected the old Checkout intent');
    }
    await t.mutation(api.stripe.completeStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      idempotencyKey: oldIntent.idempotencyKey,
      checkoutUrl: 'https://checkout.stripe.test/old',
      stripeSessionId: 'cs_old',
      expiresAt: 2_500,
      now: 2_000,
    });
    await t.mutation(api.stripe.settleStripeCheckout, {
      ...WEBHOOK_LEASE,
      secret: BRIDGE_SECRET,
      stripeSessionId: 'cs_old',
      status: 'expired',
      now: 3_000,
    });

    const newIntent = await t.mutation(api.stripe.prepareStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      returnTo: '/new',
      now: 4_000,
    });
    if (newIntent.state !== 'create') {
      throw new Error('Expected the replacement Checkout intent');
    }
    await t.mutation(api.stripe.completeStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      idempotencyKey: newIntent.idempotencyKey,
      checkoutUrl: 'https://checkout.stripe.test/new',
      stripeSessionId: 'cs_new',
      expiresAt: 100_000,
      now: 5_000,
    });
    await expect(
      t.mutation(api.stripe.settleStripeCheckout, {
        ...WEBHOOK_LEASE,
        secret: BRIDGE_SECRET,
        stripeSessionId: 'cs_new',
        stripeSubscriptionId: 'sub_new',
        subscribedUntil: 30_000,
        eventAt: 6_000,
        status: 'completed',
        now: 6_000,
      })
    ).resolves.toMatchObject({ applied: true, reason: 'completed' });

    // This payment event is delivered later, but belongs to the older intent.
    await expect(
      t.mutation(api.stripe.settleStripeCheckout, {
        ...WEBHOOK_LEASE,
        secret: BRIDGE_SECRET,
        stripeSessionId: 'cs_old',
        stripeSubscriptionId: 'sub_old',
        subscribedUntil: 40_000,
        eventAt: 7_000,
        status: 'completed',
        now: 7_000,
      })
    ).resolves.toEqual({
      applied: false,
      userId,
      reason: 'superseded',
    });

    const [user, oldCheckout] = await t.run(async (ctx) => {
      return await Promise.all([
        ctx.db.get(userId),
        ctx.db
          .query('stripeCheckoutSessions')
          .withIndex('by_stripeSessionId', (q) =>
            q.eq('stripeSessionId', 'cs_old')
          )
          .unique(),
      ]);
    });
    expect(user).toMatchObject({
      stripeSubscriptionId: 'sub_new',
      subscribedUntil: 30_000,
    });
    expect(oldCheckout?.status).toBe('expired');
  });

  it('keeps the newer Checkout authoritative when the older completion lands first', async () => {
    const t = convexTest(schema, modules);
    const userId = await insertWebUser(t, 'completion-order-user');

    const oldIntent = await t.mutation(api.stripe.prepareStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      returnTo: '/old-first',
      now: 1_000,
    });
    if (oldIntent.state !== 'create') {
      throw new Error('Expected the old Checkout intent');
    }
    await t.mutation(api.stripe.completeStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      idempotencyKey: oldIntent.idempotencyKey,
      checkoutUrl: 'https://checkout.stripe.test/old-first',
      stripeSessionId: 'cs_old_first',
      expiresAt: 2_500,
      now: 2_000,
    });
    await t.mutation(api.stripe.settleStripeCheckout, {
      ...WEBHOOK_LEASE,
      secret: BRIDGE_SECRET,
      stripeSessionId: 'cs_old_first',
      status: 'expired',
      now: 3_000,
    });

    const newIntent = await t.mutation(api.stripe.prepareStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      returnTo: '/new-second',
      now: 4_000,
    });
    if (newIntent.state !== 'create') {
      throw new Error('Expected the newer Checkout intent');
    }
    await t.mutation(api.stripe.completeStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      idempotencyKey: newIntent.idempotencyKey,
      checkoutUrl: 'https://checkout.stripe.test/new-second',
      stripeSessionId: 'cs_new_second',
      expiresAt: 100_000,
      now: 5_000,
    });

    await expect(
      t.mutation(api.stripe.settleStripeCheckout, {
        ...WEBHOOK_LEASE,
        secret: BRIDGE_SECRET,
        stripeSessionId: 'cs_old_first',
        stripeSubscriptionId: 'sub_old_first',
        subscribedUntil: 30_000,
        eventAt: 6_000,
        status: 'completed',
        now: 6_000,
      })
    ).resolves.toMatchObject({ applied: true, reason: 'completed' });
    await expect(
      t.mutation(api.stripe.settleStripeCheckout, {
        ...WEBHOOK_LEASE,
        secret: BRIDGE_SECRET,
        stripeSessionId: 'cs_new_second',
        stripeSubscriptionId: 'sub_new_second',
        subscribedUntil: 40_000,
        eventAt: 5_500,
        status: 'completed',
        now: 7_000,
      })
    ).resolves.toMatchObject({ applied: true, reason: 'completed' });

    const user = await t.run(async (ctx) => await ctx.db.get(userId));
    expect(user).toMatchObject({
      stripeSubscriptionId: 'sub_new_second',
      subscribedUntil: 40_000,
      subEventAt: 5_500,
      subEventMode: 'extend',
    });
  });

  it('keeps a newer Checkout binding authoritative after access expires', async () => {
    const t = convexTest(schema, modules);
    const userId = await insertWebUser(t, 'expired-ordering-user');

    const oldIntent = await t.mutation(api.stripe.prepareStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      returnTo: '/old-expired',
      now: 1_000,
    });
    if (oldIntent.state !== 'create') throw new Error('Expected old intent');
    await t.mutation(api.stripe.completeStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      idempotencyKey: oldIntent.idempotencyKey,
      checkoutUrl: 'https://checkout.stripe.test/old-expired',
      stripeSessionId: 'cs_old_expired',
      expiresAt: 2_500,
      now: 2_000,
    });
    await t.mutation(api.stripe.settleStripeCheckout, {
      ...WEBHOOK_LEASE,
      secret: BRIDGE_SECRET,
      stripeSessionId: 'cs_old_expired',
      status: 'expired',
      now: 3_000,
    });

    const newIntent = await t.mutation(api.stripe.prepareStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      returnTo: '/new-expired',
      now: 4_000,
    });
    if (newIntent.state !== 'create') throw new Error('Expected new intent');
    await t.mutation(api.stripe.completeStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      idempotencyKey: newIntent.idempotencyKey,
      checkoutUrl: 'https://checkout.stripe.test/new-expired',
      stripeSessionId: 'cs_new_expired',
      expiresAt: 100_000,
      now: 5_000,
    });
    await t.mutation(api.stripe.settleStripeCheckout, {
      ...WEBHOOK_LEASE,
      secret: BRIDGE_SECRET,
      stripeSessionId: 'cs_new_expired',
      stripeSubscriptionId: 'sub_new_expired',
      subscribedUntil: 6_000,
      eventAt: 5_500,
      status: 'completed',
      now: 5_500,
    });

    await expect(
      t.mutation(api.stripe.settleStripeCheckout, {
        ...WEBHOOK_LEASE,
        secret: BRIDGE_SECRET,
        stripeSessionId: 'cs_old_expired',
        stripeSubscriptionId: 'sub_old_expired',
        subscribedUntil: 50_000,
        eventAt: 7_000,
        status: 'completed',
        now: 7_000,
      })
    ).resolves.toEqual({
      applied: false,
      userId,
      reason: 'superseded',
    });

    const user = await t.run(async (ctx) => await ctx.db.get(userId));
    expect(user).toMatchObject({
      stripeSubscriptionId: 'sub_new_expired',
      subscribedUntil: 6_000,
    });
  });

  it('reconciles a cancellation that arrives before Checkout fulfillment', async () => {
    const t = convexTest(schema, modules);
    const userId = await insertWebUser(t, 'cancel-before-checkout-user');
    const intent = await t.mutation(api.stripe.prepareStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      returnTo: '/cancelled',
      now: 1_000,
    });
    if (intent.state !== 'create') {
      throw new Error('Expected a Checkout intent');
    }
    await t.mutation(api.stripe.completeStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      idempotencyKey: intent.idempotencyKey,
      checkoutUrl: 'https://checkout.stripe.test/cancelled',
      stripeSessionId: 'cs_cancelled',
      expiresAt: 100_000,
      now: 2_000,
    });

    const deletion = await t.mutation(api.stripe.beginStripeWebhookEvent, {
      secret: BRIDGE_SECRET,
      eventId: 'evt_deleted_before_fulfillment',
      type: 'customer.subscription.deleted',
      objectId: 'sub_cancelled',
      customerId: 'cus_cancelled',
      stripeCreatedAt: 3_000,
      subscriptionEndAt: 8_000,
      now: 3_000,
    });
    await t.mutation(api.stripe.finishStripeWebhookEvent, {
      secret: BRIDGE_SECRET,
      eventId: 'evt_deleted_before_fulfillment',
      leaseToken: deletion.leaseToken!,
      success: true,
      now: 3_100,
    });

    await expect(
      t.mutation(api.stripe.settleStripeCheckout, {
        ...WEBHOOK_LEASE,
        secret: BRIDGE_SECRET,
        stripeSessionId: 'cs_cancelled',
        stripeSubscriptionId: 'sub_cancelled',
        stripeCustomerId: 'cus_cancelled',
        subscribedUntil: 30_000,
        eventAt: 2_500,
        status: 'completed',
        now: 4_000,
      })
    ).resolves.toEqual({
      applied: true,
      userId,
      reason: 'subscription_deleted',
    });

    const user = await t.run(async (ctx) => await ctx.db.get(userId));
    expect(user).toMatchObject({
      stripeCustomerId: 'cus_cancelled',
      stripeSubscriptionId: 'sub_cancelled',
      subscribedUntil: 8_000,
      subEventAt: 3_000,
      subEventMode: 'end',
    });
  });

  it('prunes old Checkout records and expires only bounded active candidates', async () => {
    const t = convexTest(schema, modules);
    const userId = await insertWebUser(t, 'checkout-retention-user');
    const day = 24 * 60 * 60 * 1_000;
    const now = 100 * day;
    const ids = await t.run(async (ctx) => {
      const old = await ctx.db.insert('stripeCheckoutSessions', {
        userId,
        returnTo: '/old',
        status: 'completed',
        idempotencyKey: 'old',
        createdAt: 1,
        updatedAt: 1,
      });
      const recent = await ctx.db.insert('stripeCheckoutSessions', {
        userId,
        returnTo: '/recent',
        status: 'completed',
        idempotencyKey: 'recent',
        createdAt: now - 10 * day,
        updatedAt: now - 10 * day,
      });
      const pending = await ctx.db.insert('stripeCheckoutSessions', {
        userId,
        returnTo: '/stale-pending',
        status: 'pending',
        idempotencyKey: 'stale-pending',
        createdAt: now - 31 * 60 * 1_000,
        updatedAt: now - 31 * 60 * 1_000,
      });
      const open = await ctx.db.insert('stripeCheckoutSessions', {
        userId,
        returnTo: '/expired-open',
        status: 'open',
        idempotencyKey: 'expired-open',
        stripeSessionId: 'cs_expired_open',
        checkoutUrl: 'https://checkout.stripe.test/expired',
        expiresAt: now - 1,
        createdAt: now - 1_000,
        updatedAt: now - 1_000,
      });
      return { old, recent, pending, open };
    });

    await expect(
      t.mutation(api.stripe.prepareStripeCheckout, {
        secret: BRIDGE_SECRET,
        userId,
        returnTo: '/fresh',
        now,
      })
    ).resolves.toMatchObject({ state: 'create', returnTo: '/fresh' });

    const records = await t.run(async (ctx) => ({
      old: await ctx.db.get(ids.old),
      recent: await ctx.db.get(ids.recent),
      pending: await ctx.db.get(ids.pending),
      open: await ctx.db.get(ids.open),
    }));
    expect(records.old).toBeNull();
    expect(records.recent?.status).toBe('completed');
    expect(records.pending?.status).toBe('expired');
    expect(records.open?.status).toBe('expired');
  });
});

describe('Stripe webhook retention', () => {
  it('prunes events outside the dedupe window while retaining recent rows', async () => {
    const t = convexTest(schema, modules);
    const day = 24 * 60 * 60 * 1_000;
    const now = 100 * day;
    const ids = await t.run(async (ctx) => {
      const old = await ctx.db.insert('stripeWebhookEvents', {
        eventId: 'evt_old',
        type: 'invoice.paid',
        status: 'processed',
        lastReceivedAt: now - 91 * day,
        processedAt: now - 91 * day,
        attemptCount: 1,
      });
      const recent = await ctx.db.insert('stripeWebhookEvents', {
        eventId: 'evt_recent',
        type: 'customer.subscription.deleted',
        status: 'processed',
        objectId: 'sub_recent',
        lastReceivedAt: now - 89 * day,
        processedAt: now - 89 * day,
        attemptCount: 1,
      });
      return { old, recent };
    });

    await t.mutation(api.stripe.beginStripeWebhookEvent, {
      secret: BRIDGE_SECRET,
      eventId: 'evt_new',
      type: 'invoice.paid',
      now,
    });

    const records = await t.run(async (ctx) => ({
      old: await ctx.db.get(ids.old),
      recent: await ctx.db.get(ids.recent),
      created: await ctx.db
        .query('stripeWebhookEvents')
        .withIndex('by_eventId', (q) => q.eq('eventId', 'evt_new'))
        .unique(),
    }));
    expect(records.old).toBeNull();
    expect(records.recent).not.toBeNull();
    expect(records.created?.status).toBe('processing');
  });
});
