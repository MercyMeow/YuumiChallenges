/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        yuumi: {
          primary: 'var(--yuumi-primary)',
          secondary: 'var(--yuumi-secondary)',
          accent: 'var(--yuumi-accent)',
          dark: 'var(--yuumi-dark)',
          darker: 'var(--yuumi-darker)',
          light: 'var(--yuumi-light)',
          lighter: 'var(--yuumi-lighter)',
          success: 'var(--yuumi-success)',
          error: 'var(--yuumi-error)',
          warning: 'var(--yuumi-warning)',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'yuumi-gradient': 'linear-gradient(135deg, var(--yuumi-primary), var(--yuumi-secondary))',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-in-up': 'slideInUp 0.5s ease-out forwards',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
      },
      boxShadow: {
        'yuumi': '0 4px 14px 0 rgba(67, 97, 238, 0.3)',
        'yuumi-hover': '0 10px 25px 0 rgba(67, 97, 238, 0.5)',
      },
    },
  },
  plugins: [],
}
