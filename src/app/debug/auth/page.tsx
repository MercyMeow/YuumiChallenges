'use client';

import { useSession, signOut } from 'next-auth/react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function AuthDebug() {
  const { data: session, status } = useSession();
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const clearEverything = async () => {
    try {
      // Clear NextAuth session
      await signOut({ 
        redirect: false,
        callbackUrl: '/' 
      });

      // Clear all local storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear specific NextAuth cookies
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos) : c;
          if (name.includes('next-auth') || name.includes('__Secure-next-auth')) {
            document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          }
        });

        // Force page reload to clear all cached state
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  const forceReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen w-full p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Debug</CardTitle>
            <CardDescription>
              Debug and clear authentication state
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={clearEverything}
                variant="destructive"
                className="w-full"
              >
                🗑️ Clear Everything & Reset
              </Button>
              <Button 
                onClick={forceReload}
                variant="outline"
                className="w-full"
              >
                🔄 Force Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              <div><strong>NextAuth Status:</strong> {status}</div>
              <div><strong>Is Authenticated:</strong> {isAuthenticated.toString()}</div>
              <div><strong>Is Loading:</strong> {isLoading.toString()}</div>
              <div><strong>Has Session:</strong> {!!session ? 'true' : 'false'}</div>
              <div><strong>Has User:</strong> {!!user ? 'true' : 'false'}</div>
            </div>
          </CardContent>
        </Card>

        {session && (
          <Card>
            <CardHeader>
              <CardTitle>Session Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {user && (
          <Card>
            <CardHeader>
              <CardTitle>User Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Manual Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>If automatic clearing doesn't work:</strong></p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Open DevTools (F12) → Application tab</li>
                <li>Under Storage → Clear storage → Clear site data</li>
                <li>Or manually delete cookies starting with "next-auth"</li>
                <li>Refresh the page</li>
                <li>Try incognito mode for testing</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}