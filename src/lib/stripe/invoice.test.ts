import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StripeSubscriptionSummary } from './supporter';
import { resolvePaidSupporterInvoicePeriodEnd } from './invoice';

const SUPPORTER_SUMMARY: StripeSubscriptionSummary = {
  currentPeriodEnd: 1_900_000_000_000,
  customerId: 'cus_123',
  metadata: { yuumi_plan: 'supporter_v1' },
  planMatches: true,
  supporterItemIds: ['si_supporter'],
  supporterPriceIds: ['price_supporter'],
  subscriptionId: 'sub_123',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('resolvePaidSupporterInvoicePeriodEnd', () => {
  it('does not treat an unrelated paid invoice as a Supporter renewal', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      resolvePaidSupporterInvoicePeriodEnd(
        'sk_test',
        'in_unrelated',
        {
          lines: {
            data: [
              {
                id: 'il_unrelated',
                subscription_item: 'si_unrelated',
                period: { end: 1_900_000_000 },
                pricing: {
                  price_details: { price: 'price_unrelated' },
                },
              },
            ],
            has_more: false,
          },
        },
        SUPPORTER_SUMMARY
      )
    ).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('checks remaining invoice-line pages for the Supporter item', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        data: [
          {
            id: 'il_supporter',
            parent: {
              subscription_item_details: {
                subscription_item: 'si_supporter',
              },
            },
            period: { end: 1_727_000_000 },
            pricing: {
              price_details: { price: 'price_supporter' },
            },
          },
        ],
        has_more: false,
      }),
      ok: true,
      status: 200,
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      resolvePaidSupporterInvoicePeriodEnd(
        'sk_test',
        'in_paginated',
        {
          lines: {
            data: [
              {
                id: 'il_first',
                subscription_item: 'si_unrelated',
                period: { end: 1_900_000_000 },
              },
            ],
            has_more: true,
          },
        },
        SUPPORTER_SUMMARY
      )
    ).resolves.toBe(1_727_000_000_000);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        '/v1/invoices/in_paginated/lines?limit=100&starting_after=il_first'
      ),
      {
        headers: { Authorization: 'Bearer sk_test' },
      }
    );
  });

  it.each([
    ['missing', undefined],
    ['non-boolean', 'false'],
  ])(
    'rejects an embedded invoice page with %s has_more',
    async (_label, hasMore) => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      await expect(
        resolvePaidSupporterInvoicePeriodEnd(
          'sk_test',
          'in_malformed_embedded',
          {
            lines: {
              data: [{ id: 'il_unrelated' }],
              ...(hasMore !== undefined ? { has_more: hasMore } : {}),
            },
          },
          SUPPORTER_SUMMARY
        )
      ).rejects.toThrow('malformed invoice line page');
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it('rejects an invoice with no embedded line list', async () => {
    await expect(
      resolvePaidSupporterInvoicePeriodEnd(
        'sk_test',
        'in_missing_lines',
        {},
        SUPPORTER_SUMMARY
      )
    ).rejects.toThrow('malformed invoice line page');
  });

  it('rejects a fetched invoice page with invalid has_more', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          data: [{ id: 'il_supporter' }],
          has_more: null,
        }),
        ok: true,
        status: 200,
      })
    );

    await expect(
      resolvePaidSupporterInvoicePeriodEnd(
        'sk_test',
        'in_malformed_page',
        {
          lines: {
            data: [{ id: 'il_first' }],
            has_more: true,
          },
        },
        SUPPORTER_SUMMARY
      )
    ).rejects.toThrow('malformed invoice line page');
  });
});
