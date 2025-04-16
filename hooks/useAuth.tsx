"use client";

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface UseAuthOptions {
  required?: boolean;
  redirectTo?: string;
  role?: string | string[];
}

export function useAuth(options: UseAuthOptions = {}) {
  const { required = false, redirectTo = '/auth/signin', role } = options;
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const router = useRouter();
  const pathname = usePathname();
  
  const isAuthenticated = !!session;
  
  // Check if user has required role(s)
  const hasRequiredRole = () => {
    if (!role || !session?.user?.roles) return true;
    
    const userRoles = session.user.roles;
    if (Array.isArray(role)) {
      return role.some(r => userRoles.includes(r));
    }
    return userRoles.includes(role);
  };
  
  useEffect(() => {
    // If auth is required and user is not authenticated, redirect to login
    if (required && !loading) {
      if (!isAuthenticated) {
        // Store the current path to redirect back after login
        if (pathname !== '/auth/signin' && pathname !== '/auth/error') {
          const returnUrl = encodeURIComponent(pathname);
          router.push(`${redirectTo}?returnUrl=${returnUrl}`);
        } else {
          router.push(redirectTo);
        }
      } else if (!hasRequiredRole()) {
        // User is authenticated but doesn't have the required role
        router.push('/unauthorized');
      }
    }
  }, [required, isAuthenticated, loading, redirectTo, router, pathname]);
  
  return {
    session,
    loading,
    isAuthenticated,
    user: session?.user,
    hasRole: (checkRole: string | string[]) => {
      if (!session?.user?.roles) return false;
      
      const userRoles = session.user.roles;
      if (Array.isArray(checkRole)) {
        return checkRole.some(r => userRoles.includes(r));
      }
      return userRoles.includes(checkRole);
    },
    signIn: (provider = 'discord', options = {}) => signIn(provider, options),
    signOut: (options = {}) => signOut(options),
  };
}

export default useAuth;
