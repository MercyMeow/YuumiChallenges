'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { Gem, Link2, RefreshCw, ShieldCheck, Zap } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { useWebUser } from '@/lib/hooks/use-web-user';
import { cn } from '@/lib/utils';

// ---------- account: supporter badge, refresh, icon-verified linking ----------

/** Gem chip shown when a verified supporter owns this profile. */
export function SupporterBadge({ puuid }: { puuid: string }) {
  const isSupporter = useQuery(api.webauth.getSupporterBadge, { puuid });
  if (!isSupporter) return null;
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-sm border border-hx-magic/50 bg-hx-magic/10 px-2 py-0.5 align-middle text-[10px] tracking-widest text-hx-magic-bright uppercase shadow-[0_0_12px_oklch(0.7_0.15_200_/_0.25)]">
      <Gem className="h-3 w-3" aria-hidden />
      Supporter
    </span>
  );
}

function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Refresh + account controls under the identity header: manual refresh
 * with the shared 5-minute cooldown, auto-refresh for the verified
 * subscribed owner, and the icon-challenge linking flow (equip a starter
 * icon 0-29 we pick — never the current one — then verify).
 */
export function ProfileAccountRow({ puuid }: { puuid: string }) {
  const { user, refresh: refreshMe } = useWebUser();

  const [busy, setBusy] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [unlinkBusy, setUnlinkBusy] = useState(false);
  const [nextAllowedAt, setNextAllowedAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState<string | null>(null);
  const [ddVersion, setDdVersion] = useState<string | null>(null);

  // Ticking clock for the cooldown / challenge countdowns.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  // Full ddragon version for profile-icon images (e.g. '16.13.1').
  useEffect(() => {
    fetch('/api/data-dragon/version')
      .then((res) => res.json())
      .then((data: { version?: string }) => {
        if (typeof data.version === 'string') setDdVersion(data.version);
      })
      .catch(() => {});
  }, []);

  const isOwner = user?.linkedPuuid === puuid;
  const doRefresh = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/account/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puuid }),
      });
      const data = (await res.json()) as {
        refreshed?: boolean;
        nextAllowedAt?: number;
        error?: string;
      };
      if (typeof data.nextAllowedAt === 'number') {
        setNextAllowedAt(data.nextAllowedAt);
      }
      if (!res.ok) setNotice(data.error ?? 'Refresh is unavailable right now.');
    } catch {
      setNotice('Refresh is unavailable right now.');
    } finally {
      setBusy(false);
    }
  }, [puuid]);

  // Subscriber perk: keep the owner's profile fresh while they watch it.
  const autoRefresh = Boolean(user?.subscribed && isOwner);
  useEffect(() => {
    if (!autoRefresh) return;
    // Deferred so the effect body itself stays setState-free (the refresh
    // toggles busy state); the tick then keeps the profile fresh.
    const kickoff = setTimeout(() => void doRefresh(), 0);
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void doRefresh();
    }, 90_000);
    return () => {
      clearTimeout(kickoff);
      clearInterval(timer);
    };
  }, [autoRefresh, doRefresh]);

  const cooldownLeft = nextAllowedAt - now;
  // The active challenge always comes from the settled server state
  // (/api/auth/me), so rapid clicks can't desync icon and challenge —
  // after startLink succeeds we re-fetch the user.
  const pending =
    user?.pendingLink && user.pendingLink.puuid === puuid
      ? user.pendingLink
      : null;

  const startCheckout = useCallback(async () => {
    setCheckoutBusy(true);
    setNotice(null);
    try {
      const res = await fetch(
        `/api/stripe/checkout?return=${encodeURIComponent(window.location.pathname)}`,
        { method: 'POST' }
      );
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      if (res.status === 409) {
        await refreshMe();
      }
      setNotice(data.error ?? 'Subscriptions are unavailable right now.');
    } catch {
      setNotice('Subscriptions are unavailable right now.');
    } finally {
      setCheckoutBusy(false);
    }
  }, [refreshMe]);

  const unlinkAccount = useCallback(async () => {
    setUnlinkBusy(true);
    setNotice(null);
    try {
      const res = await fetch('/api/account/unlink', { method: 'POST' });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setNotice(data.error ?? 'Could not unlink this account right now.');
        return;
      }
      await refreshMe();
    } catch {
      setNotice('Could not unlink this account right now.');
    } finally {
      setUnlinkBusy(false);
    }
  }, [refreshMe]);

  return (
    <div className="hex-card mt-3 rounded-sm px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void doRefresh()}
          disabled={busy || cooldownLeft > 0}
          className="btn-hextech inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={cn('h-3.5 w-3.5', busy && 'animate-spin')}
            aria-hidden
          />
          {cooldownLeft > 0
            ? `Refresh in ${formatCountdown(cooldownLeft)}`
            : 'Refresh profile'}
        </button>
        {autoRefresh && (
          <span className="inline-flex items-center gap-1 text-[11px] tracking-wide text-hx-magic-bright">
            <Zap className="h-3 w-3" aria-hidden /> Auto-refresh on
          </span>
        )}
        <span className="flex-1" />
        {user && isOwner && !user.subscribed && (
          <button
            type="button"
            onClick={() => void startCheckout()}
            disabled={checkoutBusy}
            className="inline-flex items-center gap-1.5 rounded-sm border border-hx-magic/50 bg-hx-magic/10 px-3 py-1.5 text-xs text-hx-magic-bright transition-colors hover:bg-hx-magic/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Gem className="h-3.5 w-3.5" aria-hidden />
            {checkoutBusy
              ? 'Starting checkout…'
              : 'Support for 1€/mo — unlock auto-refresh'}
          </button>
        )}
        {user && isOwner && (
          <span className="inline-flex items-center gap-2 text-[11px] tracking-wide text-hx-gold/60">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
            Verified — this is you
            <button
              type="button"
              onClick={() => void unlinkAccount()}
              disabled={unlinkBusy}
              className="text-hx-gold/40 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
            >
              {unlinkBusy ? 'Unlinking…' : 'Unlink'}
            </button>
          </span>
        )}
        {user && !isOwner && !pending && (
          <button
            type="button"
            disabled={linkBusy}
            onClick={() => {
              setNotice(null);
              setLinkBusy(true);
              fetch('/api/account/link/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ puuid }),
              })
                .then(async (res) => {
                  const data = (await res.json()) as { error?: string };
                  if (!res.ok) {
                    setNotice(
                      data.error ??
                        'Could not start verification — try again later.'
                    );
                  }
                  // Show the challenge from the authoritative source.
                  await refreshMe();
                })
                .catch(() =>
                  setNotice('Could not start verification — try again later.')
                )
                .finally(() => setLinkBusy(false));
            }}
            className="inline-flex items-center gap-1.5 rounded-sm border border-hx-gold-dark/40 px-3 py-1.5 text-xs text-hx-gold/70 transition-colors hover:border-hx-gold hover:text-hx-gold-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Link2 className="h-3.5 w-3.5" aria-hidden />
            {linkBusy ? 'Starting…' : 'This is my account'}
          </button>
        )}
        {!user && (
          <a
            href={`/api/auth/discord/login?return=${encodeURIComponent(
              typeof window !== 'undefined' ? window.location.pathname : '/'
            )}`}
            className="text-[11px] tracking-wide text-hx-gold/50 underline-offset-2 hover:underline"
          >
            Sign in with Discord to claim this profile
          </a>
        )}
      </div>

      {/* Icon-challenge verification */}
      {user && !isOwner && pending && (
        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-hx-gold-dark/30 pt-3">
          {ddVersion && (
            <Image
              src={`https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/profileicon/${pending.iconId}.png`}
              alt={`Summoner icon ${pending.iconId}`}
              width={48}
              height={48}
              className="rounded-sm border border-hx-gold/50"
            />
          )}
          <div className="min-w-0 flex-1 text-xs leading-relaxed text-hx-gold/70">
            In the League client, change this account&apos;s summoner icon to
            the starter icon shown here, save, then verify.
            <span className="ml-1 text-hx-gold/40">
              Challenge expires in {formatCountdown(pending.expiresAt - now)}.
            </span>
          </div>
          <button
            type="button"
            disabled={linkBusy || pending.expiresAt < now}
            onClick={() => {
              setLinkBusy(true);
              setNotice(null);
              fetch('/api/account/link/verify', { method: 'POST' })
                .then(async (res) => {
                  const data = (await res.json()) as {
                    linked?: boolean;
                    reason?: string;
                    error?: string;
                  };
                  if (data.linked) {
                    await refreshMe();
                  } else if (data.reason === 'icon_mismatch') {
                    setNotice(
                      "Icon doesn't match yet — save it in the client, wait a few seconds, and try again."
                    );
                  } else {
                    setNotice(data.error ?? 'Challenge expired — start again.');
                    await refreshMe();
                  }
                })
                .catch(() => setNotice('Verification failed — try again.'))
                .finally(() => setLinkBusy(false));
            }}
            className="btn-hextech rounded-sm px-3 py-1.5 text-xs disabled:opacity-50"
          >
            {linkBusy ? 'Verifying…' : 'Verify'}
          </button>
        </div>
      )}
      {notice && (
        <p className="mt-2 text-[11px] tracking-wide text-amber-300/90">
          {notice}
        </p>
      )}
    </div>
  );
}
