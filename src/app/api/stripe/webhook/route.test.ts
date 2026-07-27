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

function subscriptionPayload(subscriptionId: string) {
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
    metadata: {
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
      subscribedUntil: 1_727_000_000_000,
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
    expect(mutationMock.mock.calls[0]?.[1]).toMatchObject({
      eventId: 'evt_delete',
      objectId: 'sub_cancelled',
      subscriptionEndAt: 1_726_500_000_000,
      type: 'customer.subscription.deleted',
    });
    expect(mutationMock.mock.calls[1]?.[1]).toMatchObject({
      mode: 'end',
      setSubscriptionId: 'sub_cancelled',
      stripeSubscriptionId: 'sub_cancelled',
      subscribedUntil: 1_726_500_000_000,
    });
  });
});
