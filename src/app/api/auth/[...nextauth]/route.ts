import NextAuth, { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { SupabaseAdapter } from '@next-auth/supabase-adapter';
import { createServerSupabaseClient } from '@/lib/supabase';
import { DISCORD_SCOPES } from '@/lib/utils/constants';
import { DiscordAPI } from '@/lib/apis/discord';

interface DiscordProfile {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}

const supabase = createServerSupabaseClient();

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
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'discord' && profile) {
        try {
          const discordAPI = new DiscordAPI(process.env.DISCORD_BOT_TOKEN!);
          
          // Check if user is in Yuumi Discord server
          const isYuumiMember = await discordAPI.isUserInYuumiServer((profile as DiscordProfile).id);
          
          // Get guild member info for roles
          let memberInfo = null;
          if (isYuumiMember) {
            memberInfo = await discordAPI.getGuildMember((profile as DiscordProfile).id);
          }
          
          // Update or create user in database
          const { error } = await supabase
            .from('users')
            .upsert({
              discord_id: (profile as DiscordProfile).id,
              username: (profile as DiscordProfile).username,
              discriminator: (profile as DiscordProfile).discriminator,
              avatar: (profile as DiscordProfile).avatar,
              roles: memberInfo?.roles || [],
              is_yuumi_member: isYuumiMember,
              joined_discord_at: memberInfo?.joined_at ? new Date(memberInfo.joined_at) : null,
              updated_at: new Date(),
            }, {
              onConflict: 'discord_id',
            });

          if (error) {
            console.error('Error updating user:', error);
            return false;
          }
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        // Get user info from database
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('discord_id', token.sub)
          .single();

        if (userData) {
          session.user.id = userData.id;
          session.user.discord_id = userData.discord_id;
          session.user.user_role = userData.user_role;
          session.user.is_yuumi_member = userData.is_yuumi_member;
          session.user.roles = userData.roles;
        }
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.discord_id = (profile as DiscordProfile).id;
        token.access_token = account.access_token;
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