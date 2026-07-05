import type { Config } from 'tailwindcss';
import animatePlugin from 'tailwindcss-animate';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'oklch(var(--background))',
        foreground: 'oklch(var(--foreground))',
        card: {
          DEFAULT: 'oklch(var(--card))',
          foreground: 'oklch(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'oklch(var(--popover))',
          foreground: 'oklch(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'oklch(var(--primary))',
          foreground: 'oklch(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'oklch(var(--secondary))',
          foreground: 'oklch(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'oklch(var(--muted))',
          foreground: 'oklch(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent))',
          foreground: 'oklch(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive))',
          foreground: 'oklch(var(--destructive-foreground))',
        },
        border: 'oklch(var(--border))',
        input: 'oklch(var(--input))',
        ring: 'oklch(var(--ring))',
        chart: {
          '1': 'oklch(var(--chart-1))',
          '2': 'oklch(var(--chart-2))',
          '3': 'oklch(var(--chart-3))',
          '4': 'oklch(var(--chart-4))',
          '5': 'oklch(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'oklch(var(--sidebar))',
          foreground: 'oklch(var(--sidebar-foreground))',
          primary: 'oklch(var(--sidebar-primary))',
          'primary-foreground': 'oklch(var(--sidebar-primary-foreground))',
          accent: 'oklch(var(--sidebar-accent))',
          'accent-foreground': 'oklch(var(--sidebar-accent-foreground))',
          border: 'oklch(var(--sidebar-border))',
          ring: 'oklch(var(--sidebar-ring))',
        },
        // Landing page colors
        'landing-bg-from': 'oklch(var(--landing-bg-from))',
        'landing-bg-via': 'oklch(var(--landing-bg-via))',
        'landing-bg-to': 'oklch(var(--landing-bg-to))',
        'landing-text-primary': 'oklch(var(--landing-text-primary))',
        'landing-text-secondary': 'oklch(var(--landing-text-secondary))',
        // Yuumi-inspired accent colors (alpha-aware for /opacity modifiers)
        'yuumi-purple': 'oklch(var(--yuumi-purple) / <alpha-value>)',
        'yuumi-blue': 'oklch(var(--yuumi-blue) / <alpha-value>)',
        'yuumi-teal': 'oklch(var(--yuumi-teal) / <alpha-value>)',
        'yuumi-pink': 'oklch(var(--yuumi-pink) / <alpha-value>)',
        // Modern dark theme utility colors
        success: {
          DEFAULT: 'oklch(0.70 0.16 150)',
          foreground: 'oklch(0.11 0.007 240)',
        },
        warning: {
          DEFAULT: 'oklch(0.75 0.15 50)',
          foreground: 'oklch(0.11 0.007 240)',
        },
        info: {
          DEFAULT: 'oklch(0.66 0.17 240)',
          foreground: 'oklch(0.11 0.007 240)',
        },
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
        xl: 'var(--radius-xl)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'SF Mono',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },
      width: {
        sidebar: 'var(--sidebar-width)',
        'sidebar-icon': 'var(--sidebar-width-icon)',
      },
      spacing: {
        sidebar: 'var(--sidebar-width)',
        'sidebar-icon': 'var(--sidebar-width-icon)',
      },
    },
  },
  plugins: [animatePlugin],
} satisfies Config;

export default config;
