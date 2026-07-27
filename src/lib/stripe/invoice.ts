import {
  getStripeInvoiceSupporterPeriodEnd,
  type StripeSubscriptionSummary,
} from './supporter';

const MAX_INVOICE_LINE_PAGES = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function readStripeListPage(value: unknown): {
  data: Record<string, unknown>[];
  hasMore: boolean;
} {
  if (
    !isRecord(value) ||
    !Array.isArray(value.data) ||
    typeof value.has_more !== 'boolean'
  ) {
    throw new Error('Stripe returned a malformed invoice line page');
  }
  const records = value.data.filter(isRecord);
  if (records.length !== value.data.length) {
    throw new Error('Stripe returned a malformed invoice line item');
  }
  return { data: records, hasMore: value.has_more };
}

async function readAllStripeInvoiceLines(
  stripeKey: string,
  invoiceId: string,
  invoice: Record<string, unknown>
): Promise<Record<string, unknown>[]> {
  if (!isRecord(invoice.lines)) {
    throw new Error('Stripe returned a malformed invoice line page');
  }
  const firstPage = readStripeListPage(invoice.lines);
  const lines = firstPage.data;
  let hasMore = firstPage.hasMore;
  let cursor = readString(lines.at(-1)?.id);
  let pageCount = 0;

  while (hasMore) {
    if (!cursor || pageCount >= MAX_INVOICE_LINE_PAGES) {
      throw new Error(`Could not fully inspect invoice ${invoiceId}`);
    }

    const query = new URLSearchParams({
      limit: '100',
      starting_after: cursor,
    });
    const response = await fetch(
      `https://api.stripe.com/v1/invoices/${encodeURIComponent(invoiceId)}/lines?${query}`,
      {
        headers: { Authorization: `Bearer ${stripeKey}` },
      }
    );
    if (!response.ok) {
      throw new Error(
        `Could not inspect invoice ${invoiceId} lines (${response.status})`
      );
    }

    const page = await response.json();
    const nextPage = readStripeListPage(page);
    if (nextPage.data.length === 0 && nextPage.hasMore) {
      throw new Error(`Stripe invoice ${invoiceId} pagination did not advance`);
    }

    lines.push(...nextPage.data);
    hasMore = nextPage.hasMore;
    cursor = readString(lines.at(-1)?.id);
    pageCount += 1;
  }

  return lines;
}

export async function resolvePaidSupporterInvoicePeriodEnd(
  stripeKey: string,
  invoiceId: string,
  invoice: Record<string, unknown>,
  subscriptionSummary: StripeSubscriptionSummary
): Promise<number | undefined> {
  const invoiceLines = await readAllStripeInvoiceLines(
    stripeKey,
    invoiceId,
    invoice
  );
  return getStripeInvoiceSupporterPeriodEnd(
    { lines: { data: invoiceLines } },
    subscriptionSummary
  );
}
