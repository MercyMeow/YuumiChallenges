import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export function useAuth({ required = false, redirectTo = '/auth/signin' } = {}) {
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const router = useRouter();
  
  const isAuthenticated = !!session;
  
  useEffect(() => {
    // If auth is required and user is not authenticated, redirect to login
    if (required && !loading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [required, isAuthenticated, loading, redirectTo, router]);
  
  return {
    session,
    loading,
    isAuthenticated,
    user: session?.user,
    signIn: () => signIn('discord'),
    signOut: () => signOut({ callbackUrl: '/' }),
  };
}

export default useAuth;
