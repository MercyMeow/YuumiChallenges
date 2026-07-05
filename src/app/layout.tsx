import type { Metadata, Viewport } from 'next';
import { Cinzel, Source_Sans_3 } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/providers/ClientProviders';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { yuumiDiscordEmbed } from '@/lib/embeds/yuumi';
import { buildShareDescription } from '@/lib/builds/embed-summary';
import { fetchAutoBuild } from '@/lib/builds/auto-build';
import { getLiveDdragonVersion, toGuidePatch } from '@/lib/utils/live-patch';
import { MythicShopResetBanner } from '@/components/mythic-shop/MythicShopResetBanner';
import { SiteShell } from '@/components/shell/SiteShell';

// Beaufort-like serif for headings (old LoL client look) + clean body sans.
const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-cinzel',
  display: 'swap',
});
const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans',
  display: 'swap',
});

// Public origin for absolute share URLs (og:image, twitter:image, canonical).
// Without a real origin, metadataBase falls back to localhost and Discord/
// Twitter can't fetch the preview image. Production is yuumi.quest; localhost
// is only used for local dev (override with NEXT_PUBLIC_SITE_URL).
const siteUrlFromEnv = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === 'production'
    ? 'https://yuumi.quest'
    : 'http://localhost:3000')
).replace(/\/$/, '');

const primaryEmbed = yuumiDiscordEmbed.embeds[0];
const embedColorHex = primaryEmbed?.color
  ? `#${primaryEmbed.color.toString(16).padStart(6, '0')}`
  : '#7ac4ff';

// Share title/description follow the current patch and recommended build.
// The og:image comes from src/app/opengraph-image.tsx (file convention),
// which renders runes, core items, and skill order from the same data.
export async function generateMetadata(): Promise<Metadata> {
  const [version, autoBuild] = await Promise.all([
    getLiveDdragonVersion(),
    fetchAutoBuild(),
  ]);
  // Label the share content with the patch the described build belongs to
  // (auto-scraped build's patch when present), not the newest live patch.
  const patch = autoBuild?.patch ?? toGuidePatch(version);
  const shareTitle = `Yuumi Guide · Patch ${patch}`;
  const shareDescription = buildShareDescription(patch, autoBuild);

  return {
    metadataBase: new URL(siteUrlFromEnv),
    title: shareTitle,
    description: shareDescription,
    keywords: [
      'League of Legends',
      'Yuumi',
      'Yuumi Build',
      'Yuumi Runes',
      'Match Viewer',
      'Match Analysis',
      'Timeline',
      'Riot API',
    ],
    authors: [{ name: 'Yuumi Mains Community' }],
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: shareTitle,
      description: shareDescription,
      url: '/',
      siteName: 'Yuumi Challenges',
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description: shareDescription,
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
      apple: '/favicon.ico',
    },
  };
}

export const viewport: Viewport = {
  themeColor: embedColorHex,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try { document.documentElement.classList.add('dark'); } catch (_) {}`,
          }}
        />
      </head>
      <body
        className={`${cinzel.variable} ${sourceSans.variable} dark antialiased`}
      >
        <MythicShopResetBanner />
        <ClientProviders>
          <SiteShell>{children}</SiteShell>
        </ClientProviders>
        <SpeedInsights />
      </body>
    </html>
  );
}
