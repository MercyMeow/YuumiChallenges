import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/../convex/_generated/api';

// Creates a Stripe Checkout session for the 1€/month Supporter sub. Plain
// fetch against the Stripe API (form-encoded) — no SDK dependency. The
// signed-in Convex user id rides along as client_reference_id so the
// webhook can stamp the right account. Fail-soft: without a configured
// key the route answers 503 and the UI shows supporting as unavailable.

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    new URL(request.url).origin;
  if (!stripeKey) {
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

  const returnTo = ((): string => {
    const raw = request.nextUrl.searchParams.get('return') ?? '/';
    return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
  })();

  const params = new URLSearchParams({
    mode: 'subscription',
    client_reference_id: user.id,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'eur',
    'line_items[0][price_data][unit_amount]': '100',
    'line_items[0][price_data][recurring][interval]': 'month',
    'line_items[0][price_data][product_data][name]': 'yuumi.quest Supporter',
    success_url: `${site}${returnTo}${returnTo.includes('?') ? '&' : '?'}sub=success`,
    cancel_url: `${site}${returnTo}${returnTo.includes('?') ? '&' : '?'}sub=cancelled`,
  });
  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  const session = (await res.json()) as { url?: string; error?: unknown };
  if (!res.ok || !session.url) {
    console.error('[stripe] checkout session failed:', session.error);
    return NextResponse.json(
      { error: 'Could not start checkout — try again later.' },
      { status: 502 }
    );
  }
  return NextResponse.json({ url: session.url });
}
