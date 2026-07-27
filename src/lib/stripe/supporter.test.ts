import { describe, expect, it } from 'vitest';
import {
  SUPPORTER_PLAN,
  canFinishStripeWebhookAttempt,
  getStripeInvoiceSupporterPeriodEnd,
  parseStripeInvoiceSnapshot,
  parseStripeSubscriptionSummary,
} from './supporter';

describe('parseStripeInvoiceSnapshot', () => {
  it('reads the parent subscription snapshot and invoice period end', () => {
    expect(
      parseStripeInvoiceSnapshot({
        customer: 'cus_123',
        lines: {
          data: [
            { period: { end: 1_725_000_000 } },
            { period: { end: 1_726_000_000 } },
          ],
        },
        parent: {
          subscription_details: {
            metadata: { [SUPPORTER_PLAN.metadataKey]: SUPPORTER_PLAN.value },
            subscription: 'sub_123',
          },
        },
      })
    ).toEqual({
      customerId: 'cus_123',
      metadata: { [SUPPORTER_PLAN.metadataKey]: SUPPORTER_PLAN.value },
      periodEnd: 1_726_000_000_000,
      subscriptionId: 'sub_123',
    });
  });

  it('falls back to the legacy top-level subscription field', () => {
    expect(
      parseStripeInvoiceSnapshot({
        customer: 'cus_legacy',
        period_end: 1_700_000_000,
        subscription: 'sub_legacy',
      })
    ).toEqual({
      customerId: 'cus_legacy',
      metadata: {},
      periodEnd: 1_700_000_000_000,
      subscriptionId: 'sub_legacy',
    });
  });

  it('prefers subscription line periods over the invoice usage period', () => {
    expect(
      parseStripeInvoiceSnapshot({
        period_end: 1_700_000_000,
        lines: {
          data: [{ period: { end: 1_702_500_000 } }],
        },
        parent: {
          subscription_details: {
            subscription: { id: 'sub_expanded' },
          },
        },
      })
    ).toMatchObject({
      periodEnd: 1_702_500_000_000,
      subscriptionId: 'sub_expanded',
    });
  });
});

describe('parseStripeSubscriptionSummary', () => {
  it('uses item billing periods and validates the expected Supporter plan', () => {
    expect(
      parseStripeSubscriptionSummary({
        customer: 'cus_123',
        id: 'sub_123',
        items: {
          data: [
            {
              current_period_end: 1_727_000_000,
              quantity: SUPPORTER_PLAN.quantity,
              price: {
                billing_scheme: SUPPORTER_PLAN.billingScheme,
                currency: SUPPORTER_PLAN.currency,
                recurring: {
                  interval: SUPPORTER_PLAN.interval,
                  interval_count: SUPPORTER_PLAN.intervalCount,
                  usage_type: SUPPORTER_PLAN.usageType,
                },
                unit_amount: SUPPORTER_PLAN.unitAmount,
              },
            },
          ],
        },
        metadata: {
          [SUPPORTER_PLAN.metadataKey]: SUPPORTER_PLAN.value,
          [SUPPORTER_PLAN.userIdKey]: 'user_123',
        },
      })
    ).toEqual({
      currentPeriodEnd: 1_727_000_000_000,
      customerId: 'cus_123',
      metadata: {
        [SUPPORTER_PLAN.metadataKey]: SUPPORTER_PLAN.value,
        [SUPPORTER_PLAN.userIdKey]: 'user_123',
      },
      planMatches: true,
      supporterItemIds: [],
      supporterPriceIds: [],
      subscriptionId: 'sub_123',
    });
  });

  it('rejects subscriptions whose metadata or price shape do not match', () => {
    expect(
      parseStripeSubscriptionSummary({
        id: 'sub_other',
        items: {
          data: [
            {
              current_period_end: 1_727_000_000,
              quantity: SUPPORTER_PLAN.quantity,
              price: {
                billing_scheme: SUPPORTER_PLAN.billingScheme,
                currency: 'usd',
                recurring: {
                  interval: SUPPORTER_PLAN.interval,
                  interval_count: SUPPORTER_PLAN.intervalCount,
                  usage_type: SUPPORTER_PLAN.usageType,
                },
                unit_amount: SUPPORTER_PLAN.unitAmount,
              },
            },
          ],
        },
        metadata: { [SUPPORTER_PLAN.metadataKey]: 'something_else' },
      })
    ).toMatchObject({
      planMatches: false,
      subscriptionId: 'sub_other',
    });
  });

  it('rejects a one-euro price with a longer billing interval', () => {
    expect(
      parseStripeSubscriptionSummary({
        id: 'sub_near_match',
        items: {
          data: [
            {
              quantity: SUPPORTER_PLAN.quantity,
              price: {
                billing_scheme: SUPPORTER_PLAN.billingScheme,
                currency: SUPPORTER_PLAN.currency,
                recurring: {
                  interval: SUPPORTER_PLAN.interval,
                  interval_count: 12,
                  usage_type: SUPPORTER_PLAN.usageType,
                },
                unit_amount: SUPPORTER_PLAN.unitAmount,
              },
            },
          ],
        },
        metadata: { [SUPPORTER_PLAN.metadataKey]: SUPPORTER_PLAN.value },
      })
    ).toMatchObject({
      planMatches: false,
      subscriptionId: 'sub_near_match',
    });
  });

  it('derives periods only from the matching Supporter item', () => {
    const summary = parseStripeSubscriptionSummary({
      id: 'sub_mixed',
      items: {
        data: [
          {
            id: 'si_supporter',
            current_period_end: 1_727_000_000,
            quantity: SUPPORTER_PLAN.quantity,
            price: {
              id: 'price_supporter',
              billing_scheme: SUPPORTER_PLAN.billingScheme,
              currency: SUPPORTER_PLAN.currency,
              recurring: {
                interval: SUPPORTER_PLAN.interval,
                interval_count: SUPPORTER_PLAN.intervalCount,
                usage_type: SUPPORTER_PLAN.usageType,
              },
              unit_amount: SUPPORTER_PLAN.unitAmount,
            },
          },
          {
            id: 'si_unrelated',
            current_period_end: 1_900_000_000,
            price: {
              id: 'price_unrelated',
              currency: 'eur',
              recurring: { interval: 'year' },
              unit_amount: 50_000,
            },
          },
        ],
      },
      metadata: { [SUPPORTER_PLAN.metadataKey]: SUPPORTER_PLAN.value },
    });

    expect(summary).toMatchObject({
      currentPeriodEnd: 1_727_000_000_000,
      supporterItemIds: ['si_supporter'],
      supporterPriceIds: ['price_supporter'],
    });
    expect(
      getStripeInvoiceSupporterPeriodEnd(
        {
          lines: {
            data: [
              {
                subscription_item: 'si_supporter',
                period: { end: 1_727_000_000 },
                price: { id: 'price_replaced_after_invoice' },
              },
              {
                parent: {
                  subscription_item_details: {
                    subscription_item: 'si_unrelated',
                  },
                },
                period: { end: 1_900_000_000 },
                pricing: {
                  price_details: { price: 'price_unrelated' },
                },
              },
            ],
          },
        },
        summary!
      )
    ).toBe(1_727_000_000_000);
    expect(
      getStripeInvoiceSupporterPeriodEnd(
        {
          lines: {
            data: [
              {
                parent: {
                  subscription_item_details: {
                    subscription_item: 'si_unrelated',
                  },
                },
                period: { end: 1_900_000_000 },
                pricing: {
                  price_details: { price: 'price_unrelated' },
                },
              },
            ],
          },
        },
        summary!
      )
    ).toBeUndefined();
  });

  it('does not use a subscription-wide fallback for mixed-price items', () => {
    const summary = parseStripeSubscriptionSummary({
      customer: { id: 'cus_expanded' },
      current_period_end: 1_900_000_000,
      id: 'sub_mixed_legacy',
      items: {
        data: [
          {
            quantity: SUPPORTER_PLAN.quantity,
            price: {
              billing_scheme: SUPPORTER_PLAN.billingScheme,
              currency: SUPPORTER_PLAN.currency,
              recurring: {
                interval: SUPPORTER_PLAN.interval,
                interval_count: SUPPORTER_PLAN.intervalCount,
                usage_type: SUPPORTER_PLAN.usageType,
              },
              unit_amount: SUPPORTER_PLAN.unitAmount,
            },
          },
          {
            price: {
              currency: 'eur',
              recurring: { interval: 'year' },
              unit_amount: 50_000,
            },
          },
        ],
      },
      metadata: { [SUPPORTER_PLAN.metadataKey]: SUPPORTER_PLAN.value },
    });

    expect(summary).toMatchObject({
      customerId: 'cus_expanded',
      planMatches: true,
    });
    expect(summary?.currentPeriodEnd).toBeUndefined();
  });
});

describe('canFinishStripeWebhookAttempt', () => {
  it('requires the active lease token to match the finishing attempt', () => {
    expect(
      canFinishStripeWebhookAttempt('processing', 'lease_1', 'lease_1')
    ).toBe(true);
    expect(
      canFinishStripeWebhookAttempt('processing', 'lease_1', 'lease_2')
    ).toBe(false);
    expect(
      canFinishStripeWebhookAttempt('processed', 'lease_1', 'lease_1')
    ).toBe(false);
  });
});
