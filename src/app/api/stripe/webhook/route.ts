import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/../convex/_generated/api';
import {
  getStripeCheckoutSubscriptionId,
  getStripeObjectId,
  parseStripeInvoiceSnapshot,
  parseStripeSubscriptionSummary,
} from '@/lib/stripe/supporter';
import { resolvePaidSupporterInvoicePeriodEnd } from '@/lib/stripe/invoice';

// Stripe webhook -> Convex subscription state. Signature is verified with
// Web Crypto (portable to the Cloudflare Workers runtime — no node:crypto,
// no Stripe SDK). Configure the endpoint for:
//   checkout.session.completed, checkout.session.async_payment_succeeded,
//   checkout.session.expired, invoice.paid, customer.subscription.deleted

// A month of access plus grace, applied on payment events. Renewals land
// via invoice.paid before the previous window lapses, so the horizon
// keeps rolling forward while the sub stays active.
const SUB_WINDOW_MS = 35 * 24 * 60 * 60 * 1000;

async function verifySignature(
  payload: string,
  header: string | null,
  secret: string
): Promise<boolean> {
  if (!header) return false;
  const pairs = header
    .split(',')
    .map((kv) => kv.split('=', 2) as [string, string]);
  const timestamp = pairs.find(([k]) => k === 't')?.[1];
  // Keep EVERY v1 value: during signing-secret rotation Stripe sends one
  // signature per active secret, in unspecified order.
  const signatures = pairs.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!timestamp || signatures.length === 0) return false;
  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds) || timestampSeconds <= 0) {
    return false;
  }
  // Reject stale events (>5 min) — standard replay guard.
  if (Math.abs(Date.now() / 1000 - timestampSeconds) > 300) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`)
  );
  const expected = [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  // Constant-time-ish compare against each provided signature.
  return signatures.some((signature) => {
    if (expected.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asUnixMs(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value * 1000
    : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getCancellationEnd(
  object: Record<string, unknown>
): number | undefined {
  return (
    asUnixMs(object.ended_at) ??
    asUnixMs(object.cancel_at) ??
    asUnixMs(object.current_period_end)
  );
}

async function fetchStripeSubscription(
  stripeKey: string | undefined,
  subscriptionId: string | undefined
): Promise<ReturnType<typeof parseStripeSubscriptionSummary>> {
  if (!stripeKey || !subscriptionId) return null;
  const res = await fetch(
    `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
    {
      headers: { Authorization: `Bearer ${stripeKey}` },
    }
  );
  if (!res.ok) {
    console.error(
      '[stripe] subscription lookup failed:',
      subscriptionId,
      res.status
    );
    return null;
  }
  return parseStripeSubscriptionSummary(await res.json());
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const bridgeSecret = process.env.AUTH_BRIDGE_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!webhookSecret || !bridgeSecret || !convexUrl || !stripeKey) {
    return NextResponse.json({ error: 'not configured' }, { status: 503 });
  }
  const payload = await request.text();
  const valid = await verifySignature(
    payload,
    request.headers.get('stripe-signature'),
    webhookSecret
  );
  if (!valid) {
    return NextResponse.json({ error: 'bad signature' }, { status: 400 });
  }

  let event: unknown;
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: 'bad payload' }, { status: 400 });
  }
  if (
    !isRecord(event) ||
    typeof event.type !== 'string' ||
    typeof event.id !== 'string'
  ) {
    return NextResponse.json({ error: 'bad event' }, { status: 400 });
  }
  const object =
    isRecord(event.data) && isRecord(event.data.object)
      ? event.data.object
      : {};
  const invoiceSnapshot = parseStripeInvoiceSnapshot(object);
  const customer =
    readString(object.customer) ?? invoiceSnapshot.customerId ?? undefined;
  const objectId = getStripeObjectId(object);
  const subscriptionId =
    event.type === 'invoice.paid'
      ? invoiceSnapshot.subscriptionId
      : event.type === 'customer.subscription.deleted'
        ? objectId
        : getStripeCheckoutSubscriptionId(object);
  // Stripe stamps event creation seconds; used to drop out-of-order events.
  const eventAt =
    typeof event.created === 'number' &&
    Number.isFinite(event.created) &&
    event.created > 0
      ? event.created * 1000
      : undefined;
  const fallbackExtendUntil =
    eventAt !== undefined
      ? eventAt + SUB_WINDOW_MS
      : Date.now() + SUB_WINDOW_MS;
  const subscriptionEndAt =
    event.type === 'customer.subscription.deleted'
      ? getCancellationEnd(object)
      : undefined;

  const convex = new ConvexHttpClient(convexUrl);
  const eventLease = await convex.mutation(
    api.webauth.beginStripeWebhookEvent,
    {
      secret: bridgeSecret,
      eventId: event.id,
      type: event.type,
      now: Date.now(),
      ...(eventAt !== undefined ? { stripeCreatedAt: eventAt } : {}),
      ...(customer !== undefined ? { customerId: customer } : {}),
      ...(objectId !== undefined ? { objectId } : {}),
      ...(subscriptionEndAt !== undefined ? { subscriptionEndAt } : {}),
    }
  );
  if (!eventLease.shouldProcess) {
    return NextResponse.json({ received: true, duplicate: true });
  }
  const leaseToken = eventLease.leaseToken;
  if (!leaseToken) {
    return NextResponse.json({ error: 'missing lease token' }, { status: 500 });
  }
  const apply = (args: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscribedUntil: number;
    mode: 'extend' | 'end';
    setCustomerId?: string;
    setSubscriptionId?: string;
  }) =>
    convex.mutation(api.webauth.applySubscription, {
      secret: bridgeSecret,
      ...(eventAt !== undefined ? { eventAt } : {}),
      ...(args.stripeCustomerId !== undefined
        ? { stripeCustomerId: args.stripeCustomerId }
        : {}),
      ...(args.stripeSubscriptionId !== undefined
        ? { stripeSubscriptionId: args.stripeSubscriptionId }
        : {}),
      subscribedUntil: args.subscribedUntil,
      mode: args.mode,
      ...(args.setCustomerId !== undefined
        ? { setCustomerId: args.setCustomerId }
        : {}),
      ...(args.setSubscriptionId !== undefined
        ? { setSubscriptionId: args.setSubscriptionId }
        : {}),
    });

  try {
    const needsSubscriptionLookup =
      event.type === 'invoice.paid' ||
      event.type === 'customer.subscription.deleted' ||
      ((event.type === 'checkout.session.completed' ||
        event.type === 'checkout.session.async_payment_succeeded') &&
        object.payment_status === 'paid');
    const subscriptionSummary = needsSubscriptionLookup
      ? await fetchStripeSubscription(stripeKey, subscriptionId)
      : null;
    if (needsSubscriptionLookup && !subscriptionSummary) {
      throw new Error(
        `Could not verify Stripe subscription ${subscriptionId ?? 'unknown'}`
      );
    }
    const authoritativeCustomer = subscriptionSummary?.customerId ?? customer;
    switch (event.type) {
      // Fulfillment is gated on payment_status: 'completed' fires for
      // delayed payment methods (e.g. SEPA) before money moves; those
      // sessions get their access from async_payment_succeeded instead.
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        if (object.payment_status === 'paid') {
          if (!subscriptionSummary?.planMatches) {
            throw new Error(
              'Checkout completed with an unexpected subscription'
            );
          }
          if (!objectId) {
            throw new Error('Checkout completed without a session id');
          }
          const settled = await convex.mutation(
            api.webauth.settleStripeCheckout,
            {
              secret: bridgeSecret,
              stripeSessionId: objectId,
              status: 'completed',
              stripeSubscriptionId: subscriptionSummary.subscriptionId,
              subscribedUntil:
                subscriptionSummary.currentPeriodEnd ?? fallbackExtendUntil,
              ...(authoritativeCustomer !== undefined
                ? { stripeCustomerId: authoritativeCustomer }
                : {}),
              ...(eventAt !== undefined ? { eventAt } : {}),
              now: Date.now(),
            }
          );
          if (
            !settled.applied &&
            settled.reason !== 'superseded' &&
            settled.reason !== 'stale'
          ) {
            throw new Error('Checkout completed for an unknown local session');
          }
        }
        break;
      }
      case 'invoice.paid': {
        if (!subscriptionSummary?.planMatches) {
          break;
        }
        if (!objectId) {
          throw new Error('Paid invoice is missing its id');
        }
        const subscribedUntil = await resolvePaidSupporterInvoicePeriodEnd(
          stripeKey,
          objectId,
          object,
          subscriptionSummary
        );
        if (!subscribedUntil) {
          // Mixed-interval subscriptions can emit an invoice for a different
          // item. Only a paid line tied to the Supporter item is a renewal.
          break;
        }
        const result = await apply({
          stripeSubscriptionId: subscriptionSummary.subscriptionId,
          subscribedUntil,
          mode: 'extend',
          ...(authoritativeCustomer !== undefined
            ? {
                stripeCustomerId: authoritativeCustomer,
                setCustomerId: authoritativeCustomer,
              }
            : {}),
          setSubscriptionId: subscriptionSummary.subscriptionId,
        });
        // An invoice can race ahead of checkout fulfillment, or belong to an
        // older Supporter subscription that has since been replaced. The
        // checkout event is authoritative for initial binding, so unmatched
        // or stale invoices are safely acknowledged.
        void result;
        break;
      }
      case 'customer.subscription.deleted': {
        if (!subscriptionSummary?.planMatches) {
          break;
        }
        const result = await apply({
          stripeSubscriptionId: subscriptionSummary.subscriptionId,
          subscribedUntil:
            getCancellationEnd(object) ??
            subscriptionSummary.currentPeriodEnd ??
            eventAt ??
            Date.now(),
          mode: 'end',
          ...(authoritativeCustomer !== undefined
            ? {
                stripeCustomerId: authoritativeCustomer,
                setCustomerId: authoritativeCustomer,
              }
            : {}),
          setSubscriptionId: subscriptionSummary.subscriptionId,
        });
        // Never revoke another subscription on the same customer. If this
        // exact subscription is no longer tracked, the event is irrelevant.
        void result;
        break;
      }
      case 'checkout.session.expired': {
        if (objectId) {
          await convex.mutation(api.webauth.settleStripeCheckout, {
            secret: bridgeSecret,
            stripeSessionId: objectId,
            status: 'expired',
            now: Date.now(),
          });
        }
        break;
      }
      default:
        break; // unhandled event types are acknowledged
    }
    const finished = await convex.mutation(
      api.webauth.finishStripeWebhookEvent,
      {
        secret: bridgeSecret,
        eventId: event.id,
        leaseToken,
        success: true,
        now: Date.now(),
      }
    );
    if (!finished.applied && finished.stale) {
      return NextResponse.json({ received: true, duplicate: true });
    }
  } catch (error) {
    console.error('[stripe] webhook apply failed:', error);
    const finished = await convex.mutation(
      api.webauth.finishStripeWebhookEvent,
      {
        secret: bridgeSecret,
        eventId: event.id,
        leaseToken,
        success: false,
        error:
          error instanceof Error ? error.message : 'unknown webhook failure',
        now: Date.now(),
      }
    );
    if (!finished.applied && finished.stale) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    return NextResponse.json({ error: 'apply failed' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
