import NextAuth, { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { DISCORD_SCOPES } from '@/lib/utils/constants';

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
        console.log('Processing Discord login for user:', (profile as DiscordProfile).username);
        return true;
      }
      return true;
    },
    async session({ session }) {
      console.log('Session callback triggered');
      return session;
    },
    async jwt({ token }) {
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