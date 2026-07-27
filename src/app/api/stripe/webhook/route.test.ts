import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SUPPORTER_PLAN } from '@/lib/stripe/supporter';

const { mutationMock } = vi.hoisted(() => ({
  mutationMock: vi.fn(),
}));

vi.mock('convex/browser', () => ({
  ConvexHttpClient: class {
    mutation = mutationMock;
  },
}));

import { POST } from './route';

const WEBHOOK_SECRET = 'whsec_test';

function subscriptionPayload(
  subscriptionId: string,
  options: { includeMetadata?: boolean } = {}
) {
  return {
    customer: 'cus_test',
    id: subscriptionId,
    items: {
      data: [
        {
          current_period_end: 1_727_000_000,
          id: 'si_supporter',
          price: {
            billing_scheme: SUPPORTER_PLAN.billingScheme,
            currency: SUPPORTER_PLAN.currency,
            id: 'price_supporter',
            recurring: {
              interval: SUPPORTER_PLAN.interval,
              interval_count: SUPPORTER_PLAN.intervalCount,
              usage_type: SUPPORTER_PLAN.usageType,
            },
            unit_amount: SUPPORTER_PLAN.unitAmount,
          },
          quantity: SUPPORTER_PLAN.quantity,
        },
      ],
    },
    metadata:
      options.includeMetadata === false
        ? {}
        : {
            [SUPPORTER_PLAN.metadataKey]: SUPPORTER_PLAN.value,
          },
  };
}

async function signedRequest(event: Record<string, unknown>) {
  const payload = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1_000);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`)
  );
  const signature = [...new Uint8Array(signatureBytes)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return new NextRequest('http://localhost/api/stripe/webhook', {
    body: payload,
    headers: {
      'stripe-signature': `t=${timestamp},v1=${signature}`,
    },
    method: 'POST',
  });
}

beforeEach(() => {
  mutationMock.mockReset();
  vi.stubEnv('AUTH_BRIDGE_SECRET', 'bridge_test');
  vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', 'https://convex.test');
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test');
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', WEBHOOK_SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Stripe webhook settlement wiring', () => {
  it('returns a retryable response while another worker owns the lease', async () => {
    mutationMock.mockResolvedValueOnce({
      duplicate: false,
      inProgress: true,
      shouldProcess: false,
    });

    const response = await POST(
      await signedRequest({
        data: { object: { id: 'evt_object' } },
        id: 'evt_in_progress',
        type: 'unhandled.event',
      })
    );

    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('5');
    expect(mutationMock).toHaveBeenCalledTimes(1);
  });

  it('settles paid Checkout and entitlement in one Convex mutation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => subscriptionPayload('sub_new'),
        ok: true,
        status: 200,
      })
    );
    mutationMock
      .mockResolvedValueOnce({
        leaseToken: 'lease_checkout',
        shouldProcess: true,
      })
      .mockResolvedValueOnce({
        applied: true,
        reason: 'completed',
        userId: 'user_1',
      })
      .mockResolvedValueOnce({ applied: true, stale: false });

    const response = await POST(
      await signedRequest({
        created: 1_726_000_000,
        data: {
          object: {
            customer: 'cus_test',
            id: 'cs_new',
            payment_status: 'paid',
            subscription: 'sub_new',
          },
        },
        id: 'evt_checkout',
        type: 'checkout.session.completed',
      })
    );

    expect(response.status).toBe(200);
    expect(mutationMock).toHaveBeenCalledTimes(3);
    expect(mutationMock.mock.calls[1]?.[1]).toMatchObject({
      eventAt: 1_726_000_000_000,
      status: 'completed',
      stripeCustomerId: 'cus_test',
      stripeSessionId: 'cs_new',
      stripeSubscriptionId: 'sub_new',
      subscribedUntil: 1_729_024_000_000,
    });
  });

  it('persists a cancellation end before applying an unmatched deletion', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => subscriptionPayload('sub_cancelled'),
        ok: true,
        status: 200,
      })
    );
    mutationMock
      .mockResolvedValueOnce({
        leaseToken: 'lease_delete',
        shouldProcess: true,
      })
      .mockResolvedValueOnce({ applied: false, reason: 'not_found' })
      .mockResolvedValueOnce({ applied: true, stale: false });

    const response = await POST(
      await signedRequest({
        created: 1_726_000_000,
        data: {
          object: {
            customer: 'cus_test',
            ended_at: 1_726_500_000,
            id: 'sub_cancelled',
          },
        },
        id: 'evt_delete',
        type: 'customer.subscription.deleted',
      })
    );

    expect(response.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
    expect(mutationMock.mock.calls[0]?.[1]).toMatchObject({
      eventId: 'evt_delete',
      objectId: 'sub_cancelled',
      subscriptionEndAt: 1_726_500_000_000,
      type: 'customer.subscription.deleted',
    });
    expect(mutationMock.mock.calls[1]?.[1]).toMatchObject({
      stripeSubscriptionId: 'sub_cancelled',
      subscribedUntil: 1_726_500_000_000,
    });
  });

  it('follows subscription-item pagination before classifying a renewal', async () => {
    const supporterItem = subscriptionPayload('sub_paginated').items.data[0]!;
    const fetchMock = vi.fn().mockImplementation(async (input: string) => {
      if (input.includes('/v1/subscriptions/sub_paginated')) {
        return {
          json: async () => ({
            ...subscriptionPayload('sub_paginated'),
            items: {
              data: [
                {
                  id: 'si_unrelated',
                  quantity: 1,
                  price: {
                    billing_scheme: 'per_unit',
                    currency: 'eur',
                    recurring: {
                      interval: 'year',
                      interval_count: 1,
                      usage_type: 'licensed',
                    },
                    unit_amount: 500,
                  },
                },
              ],
              has_more: true,
            },
          }),
          ok: true,
          status: 200,
        };
      }
      if (input.includes('/v1/subscription_items?')) {
        return {
          json: async () => ({
            data: [supporterItem],
            has_more: false,
          }),
          ok: true,
          status: 200,
        };
      }
      throw new Error(`Unexpected Stripe request: ${input}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    mutationMock
      .mockResolvedValueOnce({
        leaseToken: 'lease_paginated',
        shouldProcess: true,
      })
      .mockResolvedValueOnce({ applied: true, reason: 'applied' })
      .mockResolvedValueOnce({ applied: true, stale: false });

    const response = await POST(
      await signedRequest({
        created: 1_726_000_000,
        data: {
          object: {
            customer: 'cus_test',
            id: 'in_paginated',
            lines: {
              data: [
                {
                  id: 'il_supporter',
                  period: { end: 1_727_000_000 },
                  price: { id: 'price_supporter' },
                  subscription_item: 'si_supporter',
                },
              ],
              has_more: false,
            },
            subscription: 'sub_paginated',
          },
        },
        id: 'evt_paginated',
        type: 'invoice.paid',
      })
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/v1/subscription_items?'),
      expect.anything()
    );
    expect(mutationMock.mock.calls[1]?.[1]).toMatchObject({
      eventId: 'evt_paginated',
      leaseToken: 'lease_paginated',
      stripeSubscriptionId: 'sub_paginated',
    });
  });

  it('ends a bound subscription even after its plan metadata changes', async () => {
    vi.stubGlobal('fetch', vi.fn());
    mutationMock
      .mockResolvedValueOnce({
        leaseToken: 'lease_changed_plan',
        shouldProcess: true,
      })
      .mockResolvedValueOnce({ applied: true, reason: 'applied' })
      .mockResolvedValueOnce({ applied: true, stale: false });

    const response = await POST(
      await signedRequest({
        created: 1_726_000_000,
        data: {
          object: {
            customer: 'cus_test',
            ended_at: 1_726_500_000,
            id: 'sub_changed_plan',
            metadata: {},
          },
        },
        id: 'evt_changed_plan_delete',
        type: 'customer.subscription.deleted',
      })
    );

    expect(response.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
    expect(mutationMock.mock.calls[1]?.[1]).toMatchObject({
      eventId: 'evt_changed_plan_delete',
      leaseToken: 'lease_changed_plan',
      stripeSubscriptionId: 'sub_changed_plan',
    });
  });

  it('backfills a legacy subscription renewal through its customer binding', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: string | URL | Request) => {
        const url = String(input);
        if (url.includes('/v1/subscriptions/sub_legacy')) {
          return {
            json: async () =>
              subscriptionPayload('sub_legacy', { includeMetadata: false }),
            ok: true,
            status: 200,
          };
        }
        return {
          json: async () => ({
            data: [
              {
                id: 'il_legacy',
                period: { end: 1_728_000_000 },
                price: { id: 'price_supporter' },
                subscription_item: 'si_supporter',
              },
            ],
            has_more: false,
          }),
          ok: true,
          status: 200,
        };
      })
    );
    mutationMock
      .mockResolvedValueOnce({
        leaseToken: 'lease_legacy',
        shouldProcess: true,
      })
      .mockResolvedValueOnce({ applied: false, reason: 'not_found' })
      .mockResolvedValueOnce({ applied: true, reason: 'applied' })
      .mockResolvedValueOnce({ applied: true, stale: false });

    const response = await POST(
      await signedRequest({
        created: 1_727_000_000,
        data: {
          object: {
            customer: 'cus_test',
            id: 'in_legacy',
            lines: {
              data: [
                {
                  id: 'il_legacy',
                  period: { end: 1_728_000_000 },
                  price: { id: 'price_supporter' },
                  subscription_item: 'si_supporter',
                },
              ],
              has_more: false,
            },
            subscription: 'sub_legacy',
          },
        },
        id: 'evt_legacy_invoice',
        type: 'invoice.paid',
      })
    );

    expect(response.status).toBe(200);
    expect(mutationMock.mock.calls[2]?.[1]).toMatchObject({
      stripeCustomerId: 'cus_test',
      stripeSubscriptionId: 'sub_legacy',
      subscribedUntil: 1_730_024_000_000,
    });
  });

  it('fulfills a paid Checkout created before local session records', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () =>
          subscriptionPayload('sub_predeployment', {
            includeMetadata: false,
          }),
        ok: true,
        status: 200,
      })
    );
    mutationMock
      .mockResolvedValueOnce({
        leaseToken: 'lease_predeployment',
        shouldProcess: true,
      })
      .mockResolvedValueOnce({ applied: true, reason: 'completed' })
      .mockResolvedValueOnce({ applied: true, stale: false });

    const response = await POST(
      await signedRequest({
        created: 1_726_000_000,
        data: {
          object: {
            client_reference_id: 'legacy_convex_user',
            customer: 'cus_test',
            id: 'cs_predeployment',
            payment_status: 'paid',
            subscription: 'sub_predeployment',
          },
        },
        id: 'evt_predeployment',
        type: 'checkout.session.completed',
      })
    );

    expect(response.status).toBe(200);
    expect(mutationMock.mock.calls[1]?.[1]).toMatchObject({
      eventId: 'evt_predeployment',
      userId: 'legacy_convex_user',
      stripeCustomerId: 'cus_test',
      stripeSubscriptionId: 'sub_predeployment',
      subscribedUntil: 1_729_024_000_000,
    });
  });

  it('marks an unpaid completed Checkout as payment pending', async () => {
    vi.stubGlobal('fetch', vi.fn());
    mutationMock
      .mockResolvedValueOnce({
        leaseToken: 'lease_pending',
        shouldProcess: true,
      })
      .mockResolvedValueOnce({ applied: true, reason: 'payment_pending' })
      .mockResolvedValueOnce({ applied: true, stale: false });

    const response = await POST(
      await signedRequest({
        created: 1_726_000_000,
        data: {
          object: {
            id: 'cs_pending',
            payment_status: 'unpaid',
            subscription: 'sub_pending',
          },
        },
        id: 'evt_pending',
        type: 'checkout.session.completed',
      })
    );

    expect(response.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
    expect(mutationMock.mock.calls[1]?.[1]).toMatchObject({
      status: 'payment_pending',
      stripeSessionId: 'cs_pending',
      stripeSubscriptionId: 'sub_pending',
    });
  });
});
