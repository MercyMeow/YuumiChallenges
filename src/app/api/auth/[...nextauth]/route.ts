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
  callbacks: {
    async signIn({ account, profile }) {
      console.log('SignIn callback triggered for provider:', account?.provider);
      
      if (account?.provider === 'discord' && profile) {
        console.log('Processing Discord login for user:', (profile as DiscordProfile).username);
        return true;
      }
      return true;
    },
    async session({ session, token }) {
      console.log('Session callback triggered');
      return session;
    },
    async jwt({ token, account, profile }) {
      console.log('JWT callback triggered');
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