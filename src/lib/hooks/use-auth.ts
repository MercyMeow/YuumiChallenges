'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export function useAuth() {
  const { data: session, status } = useSession();

  const user = useMemo(() => {
    if (!session?.user) return null;
    
    return {
      id: session.user.id,
      discord_id: session.user.discord_id,
      name: session.user.name || '',
      image: session.user.image || undefined,
      user_role: session.user.user_role,
      is_yuumi_member: session.user.is_yuumi_member,
      roles: session.user.roles,
    };
  }, [session]);

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && !!session;

  const isOwner = user?.user_role === 'owner';
  const isAdmin = user?.user_role === 'admin' || isOwner;
  const isModerator = user?.user_role === 'admin' || isOwner; // Remove moderator role, only admin and owner have elevated permissions
  const isYuumiMember = user?.is_yuumi_member || false;

  return {
    user,
    isLoading,
    isAuthenticated,
    isOwner,
    isAdmin,
    isModerator,
    isYuumiMember,
    status,
  };
}