import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'convex',
          environment: 'edge-runtime',
          include: ['convex/**/*.{test,spec}.{ts,tsx}'],
          setupFiles: [],
        },
      },
      {
        extends: true,
        test: {
          name: 'frontend',
          environment: 'jsdom',
          include: [
            'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
            'test/**/*.{test,spec}.{js,jsx,ts,tsx}',
          ],
          setupFiles: ['./test/setup.ts'],
        },
      },
    ],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/': `${path.resolve(__dirname, 'src')}/`,
      'server-only': path.resolve(__dirname, 'test/server-only.ts'),
    },
  },
});
