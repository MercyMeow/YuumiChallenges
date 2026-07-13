import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/../convex/_generated/api';

// Stripe webhook -> Convex subscription state. Signature is verified with
// Web Crypto (portable to the Cloudflare Workers runtime — no node:crypto,
// no Stripe SDK). Configure the endpoint for:
//   checkout.session.completed, invoice.paid, customer.subscription.deleted

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
  // Reject stale events (>5 min) — standard replay guard.
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
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

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const bridgeSecret = process.env.AUTH_BRIDGE_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!webhookSecret || !bridgeSecret || !convexUrl) {
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
  if (!isRecord(event) || typeof event.type !== 'string') {
    return NextResponse.json({ error: 'bad event' }, { status: 400 });
  }
  const object =
    isRecord(event.data) && isRecord(event.data.object)
      ? event.data.object
      : {};
  const customer =
    typeof object.customer === 'string' ? object.customer : undefined;

  const convex = new ConvexHttpClient(convexUrl);
  const apply = (args: {
    userId?: string;
    stripeCustomerId?: string;
    subscribedUntil: number;
    mode: 'extend' | 'end';
    setCustomerId?: string;
  }) =>
    convex.mutation(api.webauth.applySubscription, {
      secret: bridgeSecret,
      ...(args.userId !== undefined
        ? // Convex ids serialize as strings; the mutation validates.
          { userId: args.userId as never }
        : {}),
      ...(args.stripeCustomerId !== undefined
        ? { stripeCustomerId: args.stripeCustomerId }
        : {}),
      subscribedUntil: args.subscribedUntil,
      mode: args.mode,
      ...(args.setCustomerId !== undefined
        ? { setCustomerId: args.setCustomerId }
        : {}),
    });

  try {
    switch (event.type) {
      // Fulfillment is gated on payment_status: 'completed' fires for
      // delayed payment methods (e.g. SEPA) before money moves; those
      // sessions get their access from async_payment_succeeded instead.
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const userId =
          typeof object.client_reference_id === 'string'
            ? object.client_reference_id
            : undefined;
        if (userId && object.payment_status === 'paid') {
          await apply({
            userId,
            subscribedUntil: Date.now() + SUB_WINDOW_MS,
            mode: 'extend',
            ...(customer !== undefined ? { setCustomerId: customer } : {}),
          });
        }
        break;
      }
      case 'invoice.paid': {
        if (customer) {
          await apply({
            stripeCustomerId: customer,
            subscribedUntil: Date.now() + SUB_WINDOW_MS,
            mode: 'extend',
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        if (customer) {
          await apply({
            stripeCustomerId: customer,
            subscribedUntil: Date.now(),
            mode: 'end',
          });
        }
        break;
      }
      default:
        break; // unhandled event types are acknowledged
    }
  } catch (error) {
    console.error('[stripe] webhook apply failed:', error);
    return NextResponse.json({ error: 'apply failed' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
