'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (authLoading) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="flex min-h-screen items-center justify-center p-4 hex-page-bg"
      >
        <span className="sr-only">Loading…</span>
        <div className="relative w-full max-w-md">
          <Card className="hex-card-elevated hex-corners relative w-full rounded-sm border-0">
            <CardHeader className="text-center">
              <Skeleton className="mx-auto mb-4 h-16 w-16" />
              <Skeleton className="mx-auto h-7 w-40" />
              <Skeleton className="mx-auto mt-2 h-4 w-52" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    router.push('/admin');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 hex-page-bg">
      <div className="relative w-full max-w-md duration-500 animate-in fade-in slide-in-from-bottom-4">
        <Card className="hex-card-elevated hex-corners relative w-full rounded-sm border-0">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-sm bg-hx-gold/15">
              <Lock className="h-8 w-8 text-hx-gold" />
            </div>
            <CardTitle className="text-gradient-gold text-2xl font-black tracking-wide uppercase">
              Admin Login
            </CardTitle>
            <p className="text-sm text-landing-text-secondary">
              Sign in to manage the Yuumi guide
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="rounded-sm border-red-500/30 bg-red-500/10">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-hx-parchment/80">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-hx-gold/40" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="rounded-sm border-hx-gold-dark/60 bg-hx-black/60 pl-10 text-hx-parchment placeholder:text-hx-gold/40"
                    placeholder="Enter username"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-hx-parchment/80">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-hx-gold/40" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-sm border-hx-gold-dark/60 bg-hx-black/60 pl-10 text-hx-parchment placeholder:text-hx-gold/40"
                    placeholder="Enter password"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="btn-hextech w-full rounded-sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
