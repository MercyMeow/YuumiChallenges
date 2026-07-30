'use client';

import { ReactNode } from 'react';
import { ConvexProvider } from './ConvexProvider';
import { ThemeProvider } from '@/contexts/theme-context';

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </ConvexProvider>
  );
}
