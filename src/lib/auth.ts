import { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { DISCORD_SCOPES } from '@/lib/utils/constants';
import { DiscordAPI } from '@/lib/apis/discord';
import { createServerSupabaseClient } from '@/lib/supabase';

interface DiscordProfile {
  id: string;
  username: string;
  avatar: string | null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: DISCORD_SCOPES.join(' '),
        },
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ account, profile }) {
      console.log('SignIn callback triggered for provider:', account?.provider);
      
      if (account?.provider === 'discord' && profile) {
        const discordProfile = profile as DiscordProfile;
        console.log('Processing Discord login for user:', discordProfile.username);
        
        try {
          // Initialize Supabase client first
          const supabase = createServerSupabaseClient();
          
          // Initialize Discord API with fallback handling
          let isYuumiMember = false;
          try {
            const discordAPI = new DiscordAPI(process.env.DISCORD_BOT_TOKEN!);
            
            // Check if user is a member of the Yuumi server with timeout
            const membershipPromise = discordAPI.isUserInYuumiServer(discordProfile.id);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Discord API timeout')), 5000)
            );
            
            isYuumiMember = await Promise.race([membershipPromise, timeoutPromise]) as boolean;
            console.log('Discord server membership check result:', isYuumiMember);
          } catch (discordError) {
            console.warn('Discord API check failed, allowing sign-in with limited access:', discordError);
            // Don't block sign-in if Discord API fails - user can still authenticate
            // but will have limited access until Discord connectivity is restored
            isYuumiMember = false;
          }
          
          // Upsert user data in database with retry logic
          let retries = 3;
          while (retries > 0) {
            const { error } = await supabase
              .from('users')
              .upsert({
                discord_id: discordProfile.id,
                username: discordProfile.username,
                avatar: discordProfile.avatar,
                is_yuumi_member: isYuumiMember,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'discord_id',
                ignoreDuplicates: false
              });
            
            if (!error) {
              console.log('User data successfully upserted for:', discordProfile.username);
              return true;
            }
            
            console.error(`Database upsert attempt ${4 - retries} failed:`, error);
            retries--;
            
            if (retries > 0) {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
          // If all database retries failed, still allow sign-in but log the issue
          console.error('All database upsert attempts failed, but allowing sign-in');
          return true;
          
        } catch (error) {
          console.error('Critical error during Discord sign-in:', error);
          // Only block sign-in for critical errors (like malformed profile data)
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      console.log('Session callback triggered');
      
      if (session?.user && token?.sub) {
        try {
          const supabase = createServerSupabaseClient();
          
          // Get user data from database
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('discord_id', token.sub)
            .single();
          
          if (error) {
            console.error('Error fetching user data:', error);
            return session;
          }
          
          if (userData) {
            // Enrich session with database user data (defensive access)
            session.user.id = userData.discord_id; // Use discord_id as the primary identifier
            session.user.discord_id = userData.discord_id;
            session.user.user_role = userData.user_role || 'member';
            session.user.is_yuumi_member = userData.is_yuumi_member || false;
          }
        } catch (error) {
          console.error('Error enriching session:', error);
        }
      }
      
      return session;
    },
    async jwt({ token, account, profile }) {
      console.log('JWT callback triggered');
      
      if (account?.provider === 'discord' && profile) {
        const discordProfile = profile as DiscordProfile;
        token.sub = discordProfile.id;
      }
      
      return token;
    },
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
};