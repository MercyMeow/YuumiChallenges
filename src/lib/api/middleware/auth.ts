import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { authOptions } from '@/lib/auth';

import { Session } from 'next-auth';

export interface AuthResult {
  session?: Session;
  error?: string;
  status?: number;
}

export interface UserWithRole {
  user_role: string;
}

export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }
  
  return { session };
}

export async function requireRole(userId: string, roles: string[]): Promise<AuthResult & { user?: UserWithRole }> {
  const supabase = createServerSupabaseClient();
  
  const { data: user, error } = await supabase
    .from('users')
    .select('user_role')
    .eq('discord_id', userId)
    .single();
  
  if (error || !user) {
    return { error: 'User not found', status: 404 };
  }
  
  if (!roles.includes(user.user_role)) {
    return { error: 'Insufficient permissions', status: 403 };
  }
  
  return { user };
}

export async function requireAdmin(): Promise<AuthResult> {
  const authResult = await requireAuth();
  if (authResult.error) return authResult;
  
  const roleResult = await requireRole(authResult.session!.user.id, ['admin', 'owner']);
  if (roleResult.error) return roleResult;
  
  return { session: authResult.session! };
}

export async function requireOwner(): Promise<AuthResult> {
  const authResult = await requireAuth();
  if (authResult.error) return authResult;
  
  const roleResult = await requireRole(authResult.session!.user.id, ['owner']);
  if (roleResult.error) return roleResult;
  
  return { session: authResult.session! };
}

export function createAuthResponse(result: AuthResult) {
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status || 500 });
  }
  return null;
}