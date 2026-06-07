'use client';

import { ReactNode } from 'react';
import { ConvexProvider } from './ConvexProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/theme-context';

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider>
      <AuthProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}
