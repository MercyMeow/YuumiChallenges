import { convexTest } from 'convex-test';
import { beforeEach, describe, expect, it } from 'vitest';
import { api } from './_generated/api';
import schema from './schema';
import { modules } from './test.setup';

const BRIDGE_SECRET = 'test-bridge-secret';

beforeEach(() => {
  process.env.AUTH_BRIDGE_SECRET = BRIDGE_SECRET;
});

async function insertWebUser(
  t: ReturnType<typeof convexTest>,
  discordId = 'discord-user'
) {
  return await t.run(async (ctx) => {
    const now = 1_000;
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

    await expect(
      t.mutation(api.webauth.applySubscription, {
        secret: BRIDGE_SECRET,
        userId,
        subscribedUntil: 10_000,
        mode: 'extend',
        eventAt: 2_000,
        setCustomerId: 'cus_1',
        setSubscriptionId: 'sub_1',
      })
    ).resolves.toMatchObject({ applied: true });

    await expect(
      t.mutation(api.webauth.applySubscription, {
        secret: BRIDGE_SECRET,
        stripeSubscriptionId: 'sub_other',
        stripeCustomerId: 'cus_1',
        subscribedUntil: 20_000,
        mode: 'extend',
        eventAt: 3_000,
      })
    ).resolves.toEqual({ applied: false, reason: 'not_found' });

    await expect(
      t.mutation(api.webauth.applySubscription, {
        secret: BRIDGE_SECRET,
        stripeSubscriptionId: 'sub_1',
        subscribedUntil: 4_000,
        mode: 'end',
        eventAt: 4_000,
      })
    ).resolves.toMatchObject({ applied: true });

    await expect(
      t.mutation(api.webauth.applySubscription, {
        secret: BRIDGE_SECRET,
        stripeSubscriptionId: 'sub_1',
        subscribedUntil: 30_000,
        mode: 'extend',
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

    await t.mutation(api.webauth.applySubscription, {
      secret: BRIDGE_SECRET,
      userId,
      subscribedUntil: 10_000,
      mode: 'extend',
      eventAt: 2_000,
      setSubscriptionId: 'sub_old',
    });
    await t.mutation(api.webauth.applySubscription, {
      secret: BRIDGE_SECRET,
      stripeSubscriptionId: 'sub_old',
      subscribedUntil: 4_000,
      mode: 'end',
      eventAt: 4_000,
    });

    await expect(
      t.mutation(api.webauth.applySubscription, {
        secret: BRIDGE_SECRET,
        userId,
        subscribedUntil: 30_000,
        mode: 'extend',
        eventAt: 3_000,
        setSubscriptionId: 'sub_new',
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

  it('prevents an expired webhook worker from finishing a newer lease', async () => {
    const t = convexTest(schema, modules);
    const first = await t.mutation(api.webauth.beginStripeWebhookEvent, {
      secret: BRIDGE_SECRET,
      eventId: 'evt_lease',
      type: 'invoice.paid',
      now: 1_000,
    });
    expect(first.shouldProcess).toBe(true);

    const duplicate = await t.mutation(api.webauth.beginStripeWebhookEvent, {
      secret: BRIDGE_SECRET,
      eventId: 'evt_lease',
      type: 'invoice.paid',
      now: 2_000,
    });
    expect(duplicate).toMatchObject({
      shouldProcess: false,
      duplicate: true,
    });

    const retry = await t.mutation(api.webauth.beginStripeWebhookEvent, {
      secret: BRIDGE_SECRET,
      eventId: 'evt_lease',
      type: 'invoice.paid',
      now: 5 * 60 * 1_000 + 1_001,
    });
    expect(retry.shouldProcess).toBe(true);
    expect(retry.leaseToken).not.toBe(first.leaseToken);

    await expect(
      t.mutation(api.webauth.finishStripeWebhookEvent, {
        secret: BRIDGE_SECRET,
        eventId: 'evt_lease',
        leaseToken: first.leaseToken!,
        success: false,
        error: 'late failure',
        now: 5 * 60 * 1_000 + 2_000,
      })
    ).resolves.toEqual({ applied: false, stale: true });

    await expect(
      t.mutation(api.webauth.finishStripeWebhookEvent, {
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
  it('reuses the same checkout intent after a recorded provider failure', async () => {
    const t = convexTest(schema, modules);
    const userId = await insertWebUser(t, 'failed-checkout-user');

    const first = await t.mutation(api.webauth.prepareStripeCheckout, {
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
      t.mutation(api.webauth.recordStripeCheckoutFailure, {
        secret: BRIDGE_SECRET,
        userId,
        idempotencyKey: first.idempotencyKey,
        error: 'Stripe request timed out',
        now: 2_000,
      })
    ).resolves.toEqual({ applied: true });

    const retry = await t.mutation(api.webauth.prepareStripeCheckout, {
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

    const first = await t.mutation(api.webauth.prepareStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      returnTo: '/players/euw/example',
      now: 1_000,
    });
    expect(first.state).toBe('create');

    const pendingRetry = await t.mutation(api.webauth.prepareStripeCheckout, {
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

    await t.mutation(api.webauth.completeStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      idempotencyKey: first.idempotencyKey,
      checkoutUrl: 'https://checkout.stripe.test/session',
      stripeSessionId: 'cs_1',
      expiresAt: 100_000,
      now: 3_000,
    });

    const openRetry = await t.mutation(api.webauth.prepareStripeCheckout, {
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

    const settled = await t.mutation(api.webauth.settleStripeCheckout, {
      secret: BRIDGE_SECRET,
      stripeSessionId: 'cs_1',
      stripeSubscriptionId: 'sub_1',
      status: 'completed',
      now: 5_000,
    });
    expect(settled).toEqual({ applied: true, userId });

    // Settlement resolves the authoritative local user but does not mutate
    // entitlement identifiers before the ordered applySubscription write.
    const user = await t.run(async (ctx) => await ctx.db.get(userId));
    expect(user?.stripeSubscriptionId).toBeUndefined();

    const lateExpiry = await t.mutation(api.webauth.settleStripeCheckout, {
      secret: BRIDGE_SECRET,
      stripeSessionId: 'cs_1',
      status: 'expired',
      now: 6_000,
    });
    expect(lateExpiry).toEqual({ applied: false, userId });

    const second = await t.mutation(api.webauth.prepareStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      returnTo: '/players/euw/example',
      now: 7_000,
    });
    expect(second.state).toBe('create');
    if (second.state !== 'create') {
      throw new Error('Expected a second checkout intent');
    }
    await t.mutation(api.webauth.completeStripeCheckout, {
      secret: BRIDGE_SECRET,
      userId,
      idempotencyKey: second.idempotencyKey,
      checkoutUrl: 'https://checkout.stripe.test/delayed',
      stripeSessionId: 'cs_2',
      expiresAt: 100_000,
      now: 8_000,
    });
    await t.mutation(api.webauth.settleStripeCheckout, {
      secret: BRIDGE_SECRET,
      stripeSessionId: 'cs_2',
      status: 'expired',
      now: 9_000,
    });
    const delayedCompletion = await t.mutation(
      api.webauth.settleStripeCheckout,
      {
        secret: BRIDGE_SECRET,
        stripeSessionId: 'cs_2',
        stripeSubscriptionId: 'sub_2',
        status: 'completed',
        now: 10_000,
      }
    );
    expect(delayedCompletion).toEqual({ applied: true, userId });

    const checkout = await t.run(async (ctx) => {
      return await ctx.db
        .query('stripeCheckoutSessions')
        .withIndex('by_stripeSessionId', (q) => q.eq('stripeSessionId', 'cs_2'))
        .unique();
    });
    expect(checkout?.status).toBe('completed');
  });
});
