import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ClientProviders } from '@/providers/ClientProviders';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { yuumiDiscordEmbed } from '@/lib/embeds/yuumi';
import { MythicShopResetBanner } from '@/components/mythic-shop/MythicShopResetBanner';

const siteUrlFromEnv =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'http://localhost:3000';

const primaryEmbed = yuumiDiscordEmbed.embeds[0];
const shareTitle = primaryEmbed?.title ?? 'Yuumi Match Viewer';
const shareDescription =
  primaryEmbed?.description ??
  'Timeline-aware Yuumi match analysis with runes, item spikes, objectives, and combat breakdowns.';
const embedColorHex = primaryEmbed?.color
  ? `#${primaryEmbed.color.toString(16).padStart(6, '0')}`
  : '#7ac4ff';
const shareImages: string[] = [
  primaryEmbed?.image?.url,
  primaryEmbed?.thumbnail?.url,
].flatMap((url) => (url ? [url] : []));
const openGraphImages = shareImages.map((url, index) => ({
  url,
  width: index === 0 ? 1280 : 256,
  height: index === 0 ? 720 : 256,
  alt: index === 0 ? `${shareTitle} splash art` : `${shareTitle} emblem`,
}));

export const metadata: Metadata = {
  metadataBase: new URL(siteUrlFromEnv),
  title: shareTitle,
  description: shareDescription,
  keywords: [
    'League of Legends',
    'Yuumi',
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
    images: openGraphImages.length ? openGraphImages : undefined,
  },
  twitter: {
    card: shareImages.length ? 'summary_large_image' : 'summary',
    title: shareTitle,
    description: shareDescription,
    images: shareImages.length ? [shareImages[0]!] : undefined,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

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
            __html: `
              try {
                document.documentElement.classList.add('dark');
                // Initialize magical background early
                const createMagicalBackground = () => {
                  if (!document.querySelector('.global-magical-bg')) {
                    const bg = document.createElement('div');
                    bg.className = 'global-magical-bg';
                    bg.innerHTML = '<div class="magical-bg"></div><div class="magical-radial-1"></div><div class="magical-radial-2"></div><div class="magical-radial-3"></div>';
                    document.body.appendChild(bg);
                  }
                };
                if (document.body) {
                  createMagicalBackground();
                } else {
                  document.addEventListener('DOMContentLoaded', createMagicalBackground);
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="dark antialiased">
        <MythicShopResetBanner />
        <ClientProviders>{children}</ClientProviders>
        <SpeedInsights />
      </body>
    </html>
  );
}
