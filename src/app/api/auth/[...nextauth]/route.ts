import NextAuth, { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { DISCORD_SCOPES } from '@/lib/utils/constants';
import { DiscordAPI } from '@/lib/apis/discord';
import { createServerSupabaseClient } from '@/lib/supabase';

interface DiscordProfile {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}

const authOptions: NextAuthOptions = {
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
  callbacks: {
    async signIn({ account, profile }) {
      console.log('SignIn callback triggered for provider:', account?.provider);
      
      if (account?.provider === 'discord' && profile) {
        const discordProfile = profile as DiscordProfile;
        console.log('Processing Discord login for user:', discordProfile.username);
        
        try {
          // Initialize Discord API
          const discordAPI = new DiscordAPI(process.env.DISCORD_BOT_TOKEN!);
          
          // Check if user is a member of the Yuumi server
          const isYuumiMember = await discordAPI.isUserInYuumiServer(discordProfile.id);
          console.log('Discord server membership check result:', isYuumiMember);
          
          // Initialize Supabase client
          const supabase = createServerSupabaseClient();
          
          // Upsert user data in database
          const { error } = await supabase
            .from('users')
            .upsert({
              discord_id: discordProfile.id,
              username: discordProfile.username,
              discriminator: discordProfile.discriminator,
              avatar: discordProfile.avatar,
              is_yuumi_member: isYuumiMember,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'discord_id',
              ignoreDuplicates: false
            });
          
          if (error) {
            console.error('Error upserting user:', error);
            return false;
          }
          
          return true;
        } catch (error) {
          console.error('Error during Discord sign-in:', error);
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
            // Enrich session with database user data
            session.user.id = userData.id;
            session.user.discord_id = userData.discord_id;
            session.user.user_role = userData.user_role;
            session.user.is_yuumi_member = userData.is_yuumi_member;
            session.user.roles = userData.roles;
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };