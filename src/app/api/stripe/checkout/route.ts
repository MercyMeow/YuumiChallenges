import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/../convex/_generated/api';
import { SUPPORTER_PLAN } from '@/lib/stripe/supporter';
import { createReturnUrl, sanitizeReturnPath } from '@/lib/safe-return-path';

// Creates a Stripe Checkout session for the 1€/month Supporter sub. Plain
// fetch against the Stripe API (form-encoded) — no SDK dependency. The
// signed-in Convex user id rides along as client_reference_id so the
// webhook can stamp the right account. Fail-soft: without a configured
// key the route answers 503 and the UI shows supporting as unavailable.

type StripeCheckoutSessionResponse = {
  id?: string;
  url?: string;
  customer?: string | null;
  expires_at?: number;
  error?: {
    message?: string;
    type?: string;
  };
};

function appendSubscriptionState(
  site: string,
  returnTo: string,
  state: string
) {
  return createReturnUrl(site, returnTo, {
    key: 'sub',
    value: state,
  }).toString();
}

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const bridgeSecret = process.env.AUTH_BRIDGE_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    new URL(request.url).origin;
  if (!stripeKey || !bridgeSecret) {
    return NextResponse.json(
      { error: 'Subscriptions are not configured yet.' },
      { status: 503 }
    );
  }
  const token = request.cookies.get('yq_session')?.value;
  if (!token || !convexUrl) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }
  const user = await new ConvexHttpClient(convexUrl).query(api.webauth.me, {
    token,
  });
  if (!user) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }
  if (user.subscribed) {
    // One recurring subscription per account: a second Checkout would
    // create a parallel Stripe subscription and orphan the first one's
    // customer id.
    return NextResponse.json(
      { error: 'You already have an active Supporter subscription. 💛' },
      { status: 409 }
    );
  }

  const returnTo = sanitizeReturnPath(
    request.nextUrl.searchParams.get('return')
  );
  const convex = new ConvexHttpClient(convexUrl);
  const now = Date.now();
  const checkout = await convex.mutation(api.stripe.prepareStripeCheckout, {
    secret: bridgeSecret,
    userId: user.id,
    returnTo,
    now,
  });
  if (checkout.state === 'already_subscribed') {
    return NextResponse.json(
      { error: 'You already have an active Supporter subscription. 💛' },
      { status: 409 }
    );
  }
  if (checkout.state === 'payment_pending') {
    return NextResponse.json(
      {
        error:
          'Your previous subscription payment is still processing. Please wait for it to finish before trying again.',
      },
      { status: 409 }
    );
  }
  if (checkout.checkoutUrl) {
    return NextResponse.json({ url: checkout.checkoutUrl, reused: true });
  }

  const params = new URLSearchParams({
    mode: 'subscription',
    client_reference_id: user.id,
    [`metadata[${SUPPORTER_PLAN.checkoutKey}]`]: checkout.idempotencyKey,
    [`metadata[${SUPPORTER_PLAN.metadataKey}]`]: SUPPORTER_PLAN.value,
    'line_items[0][quantity]': String(SUPPORTER_PLAN.quantity),
    'line_items[0][price_data][currency]': SUPPORTER_PLAN.currency,
    'line_items[0][price_data][unit_amount]': String(SUPPORTER_PLAN.unitAmount),
    'line_items[0][price_data][recurring][interval]': SUPPORTER_PLAN.interval,
    'line_items[0][price_data][recurring][interval_count]': String(
      SUPPORTER_PLAN.intervalCount
    ),
    'line_items[0][price_data][product_data][name]': 'yuumi.quest Supporter',
    [`subscription_data[metadata][${SUPPORTER_PLAN.checkoutKey}]`]:
      checkout.idempotencyKey,
    [`subscription_data[metadata][${SUPPORTER_PLAN.metadataKey}]`]:
      SUPPORTER_PLAN.value,
    [`subscription_data[metadata][${SUPPORTER_PLAN.userIdKey}]`]: user.id,
    success_url: appendSubscriptionState(
      site,
      sanitizeReturnPath(checkout.returnTo),
      'success'
    ),
    cancel_url: appendSubscriptionState(
      site,
      sanitizeReturnPath(checkout.returnTo),
      'cancelled'
    ),
  });
  if (checkout.stripeCustomerId) {
    params.set('customer', checkout.stripeCustomerId);
  }
  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': checkout.idempotencyKey,
    },
    body: params,
  });
  const session = (await res.json()) as StripeCheckoutSessionResponse;
  if (!res.ok || !session.url || !session.id || !session.expires_at) {
    const message =
      session.error?.message ?? 'Could not confirm checkout with Stripe.';
    await convex.mutation(api.stripe.recordStripeCheckoutFailure, {
      secret: bridgeSecret,
      userId: user.id,
      idempotencyKey: checkout.idempotencyKey,
      error: message,
      now: Date.now(),
    });
    console.error(
      '[stripe] checkout session failed:',
      session.error ?? session
    );
    return NextResponse.json(
      {
        error:
          'Could not start checkout. Retry once to resume the same session.',
      },
      { status: 502 }
    );
  }
  await convex.mutation(api.stripe.completeStripeCheckout, {
    secret: bridgeSecret,
    userId: user.id,
    idempotencyKey: checkout.idempotencyKey,
    checkoutUrl: session.url,
    stripeSessionId: session.id,
    expiresAt: session.expires_at * 1000,
    ...(typeof session.customer === 'string'
      ? { stripeCustomerId: session.customer }
      : {}),
    now: Date.now(),
  });
  return NextResponse.json({ url: session.url });
}
