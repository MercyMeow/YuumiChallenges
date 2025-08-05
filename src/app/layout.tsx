import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/session-provider";
import { ThemeProvider } from "@/contexts/theme-context";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Yuum.Ai Dashboard",
  description: "Challenge tracking dashboard for League of Legends Yuumi Mains Discord community",
  keywords: ["League of Legends", "Yuumi", "Discord", "Challenges", "Gaming"],
  authors: [{ name: "Yuumi Mains Community" }],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
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
      <body
        className="antialiased dark"
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
