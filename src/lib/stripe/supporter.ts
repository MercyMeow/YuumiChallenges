export const SUPPORTER_PLAN = {
  metadataKey: 'yuumi_plan',
  userIdKey: 'yuumi_web_user_id',
  checkoutKey: 'yuumi_checkout_key',
  value: 'supporter_v1',
  currency: 'eur',
  interval: 'month',
  intervalCount: 1,
  quantity: 1,
  billingScheme: 'per_unit',
  usageType: 'licensed',
  unitAmount: 100,
} as const;

export type StripeInvoiceSnapshot = {
  customerId?: string;
  metadata: Record<string, string>;
  periodEnd?: number;
  subscriptionId?: string;
};

export type StripeSubscriptionSummary = {
  currentPeriodEnd?: number;
  customerId?: string;
  hasSupporterPriceShape: boolean;
  metadata: Record<string, string>;
  planMatches: boolean;
  supporterItemIds: string[];
  supporterPriceIds: string[];
  subscriptionId: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asUnixMs(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value * 1000
    : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function readExpandableId(value: unknown): string | undefined {
  return (
    readString(value) ?? (isRecord(value) ? readString(value.id) : undefined)
  );
}

function readMetadata(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string'
    )
  );
}

function readItems(value: unknown): Record<string, unknown>[] {
  if (!isRecord(value) || !Array.isArray(value.data)) return [];
  return value.data.filter(isRecord);
}

function readSubscriptionItemPeriodEnd(
  item: Record<string, unknown>
): number | undefined {
  return asUnixMs(item.current_period_end);
}

function readInvoiceLinePeriodEnd(
  line: Record<string, unknown>
): number | undefined {
  const period = isRecord(line.period) ? line.period : null;
  return asUnixMs(period?.end);
}

function hasSupporterPriceShape(item: Record<string, unknown>): boolean {
  const price = isRecord(item.price) ? item.price : null;
  const recurring = isRecord(price?.recurring) ? price.recurring : null;
  const currency = readString(price?.currency);
  const unitAmount = readNumber(price?.unit_amount);
  const billingScheme = readString(price?.billing_scheme);
  const interval = readString(recurring?.interval);
  const intervalCount = readNumber(recurring?.interval_count);
  const usageType = readString(recurring?.usage_type);
  const quantity = readNumber(item.quantity);

  return (
    currency === SUPPORTER_PLAN.currency &&
    unitAmount === SUPPORTER_PLAN.unitAmount &&
    billingScheme === SUPPORTER_PLAN.billingScheme &&
    interval === SUPPORTER_PLAN.interval &&
    intervalCount === SUPPORTER_PLAN.intervalCount &&
    usageType === SUPPORTER_PLAN.usageType &&
    quantity === SUPPORTER_PLAN.quantity
  );
}

function getSubscriptionItemId(
  item: Record<string, unknown>
): string | undefined {
  return readString(item.id);
}

function getSubscriptionItemPriceId(
  item: Record<string, unknown>
): string | undefined {
  const price = isRecord(item.price) ? item.price : null;
  return readExpandableId(price?.id);
}

function getInvoiceLinePriceId(
  line: Record<string, unknown>
): string | undefined {
  const legacyPrice = isRecord(line.price) ? line.price : null;
  const pricing = isRecord(line.pricing) ? line.pricing : null;
  const priceDetails = isRecord(pricing?.price_details)
    ? pricing.price_details
    : null;
  return (
    readExpandableId(legacyPrice?.id) ?? readExpandableId(priceDetails?.price)
  );
}

function getInvoiceLineSubscriptionItemId(
  line: Record<string, unknown>
): string | undefined {
  const parent = isRecord(line.parent) ? line.parent : null;
  const details = isRecord(parent?.subscription_item_details)
    ? parent.subscription_item_details
    : null;
  return (
    readExpandableId(details?.subscription_item) ??
    readExpandableId(line.subscription_item)
  );
}

export function isSupporterPlanMetadata(
  metadata: Record<string, string> | undefined
): boolean {
  return metadata?.[SUPPORTER_PLAN.metadataKey] === SUPPORTER_PLAN.value;
}

export function getStripeCheckoutSubscriptionId(
  object: Record<string, unknown>
): string | undefined {
  return readExpandableId(object.subscription);
}

export function getStripeObjectId(
  object: Record<string, unknown>
): string | undefined {
  return readString(object.id);
}

export function parseStripeInvoiceSnapshot(
  object: Record<string, unknown>
): StripeInvoiceSnapshot {
  const parent = isRecord(object.parent) ? object.parent : null;
  const subscriptionDetails = isRecord(parent?.subscription_details)
    ? parent.subscription_details
    : null;
  const lines = readItems(object.lines);
  const linePeriodEnds = lines
    .map(readInvoiceLinePeriodEnd)
    .filter((value): value is number => value !== undefined);
  const customerId = readExpandableId(object.customer);
  // Subscription line periods describe the paid service window. The
  // invoice-level period can describe the preceding usage window, so it is
  // only a legacy fallback.
  const periodEnd =
    (linePeriodEnds.length > 0 ? Math.max(...linePeriodEnds) : undefined) ??
    asUnixMs(object.period_end);
  const subscriptionId =
    readExpandableId(subscriptionDetails?.subscription) ??
    readExpandableId(object.subscription);

  return {
    metadata: readMetadata(subscriptionDetails?.metadata),
    ...(customerId !== undefined ? { customerId } : {}),
    ...(periodEnd !== undefined ? { periodEnd } : {}),
    ...(subscriptionId !== undefined ? { subscriptionId } : {}),
  };
}

export function parseStripeSubscriptionSummary(
  value: unknown
): StripeSubscriptionSummary | null {
  if (!isRecord(value)) return null;
  const subscriptionId = readString(value.id);
  if (!subscriptionId) return null;

  const itemList = isRecord(value.items) ? value.items : null;
  // Callers must retrieve all subscription-item pages before classification;
  // treating an embedded partial page as complete can silently miss the plan.
  if (itemList?.has_more === true) return null;
  const items = readItems(itemList);
  const supporterItems = items.filter(hasSupporterPriceShape);
  const itemPeriodEnds = supporterItems
    .map(readSubscriptionItemPeriodEnd)
    .filter((periodEnd): periodEnd is number => periodEnd !== undefined);
  const supporterItemIds = supporterItems
    .map(getSubscriptionItemId)
    .filter((id): id is string => id !== undefined);
  const supporterPriceIds = supporterItems
    .map(getSubscriptionItemPriceId)
    .filter((id): id is string => id !== undefined);
  const metadata = readMetadata(value.metadata);
  const customerId = readExpandableId(value.customer);
  const currentPeriodEnd =
    (itemPeriodEnds.length > 0 ? Math.max(...itemPeriodEnds) : undefined) ??
    (items.length === supporterItems.length
      ? asUnixMs(value.current_period_end)
      : undefined);

  return {
    subscriptionId,
    ...(customerId !== undefined ? { customerId } : {}),
    ...(currentPeriodEnd !== undefined ? { currentPeriodEnd } : {}),
    metadata,
    hasSupporterPriceShape: supporterItems.length > 0,
    planMatches: isSupporterPlanMetadata(metadata) && supporterItems.length > 0,
    supporterItemIds,
    supporterPriceIds,
  };
}

export function getStripeInvoiceSupporterPeriodEnd(
  object: Record<string, unknown>,
  summary: Pick<
    StripeSubscriptionSummary,
    'supporterItemIds' | 'supporterPriceIds'
  >
): number | undefined {
  const supporterItemIds = new Set(summary.supporterItemIds);
  const supporterPriceIds = new Set(summary.supporterPriceIds);
  const matchingPeriodEnds = readItems(object.lines)
    .filter((line) => {
      const itemId = getInvoiceLineSubscriptionItemId(line);
      const priceId = getInvoiceLinePriceId(line);
      return (
        (itemId !== undefined && supporterItemIds.has(itemId)) ||
        (priceId !== undefined && supporterPriceIds.has(priceId))
      );
    })
    .map(readInvoiceLinePeriodEnd)
    .filter((periodEnd): periodEnd is number => periodEnd !== undefined);

  return matchingPeriodEnds.length > 0
    ? Math.max(...matchingPeriodEnds)
    : undefined;
}

export { canFinishStripeWebhookAttempt } from './webhook-lease';
