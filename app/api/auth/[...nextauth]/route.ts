import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/db/mongodb-client";

// Define the scopes we need from Discord
const scopes = ['identify', 'email'].join(' ');

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
      authorization: { params: { scope: scopes } },
    }),
  ],
  adapter: MongoDBAdapter(clientPromise),
  callbacks: {
    async session({ session, user }: any) {
      // Add user ID to the session
      if (session.user) {
        session.user.id = user.id;
        session.user.discordId = user.discordId;
        session.user.roles = user.roles || ['user'];
      }
      return session;
    },
    async jwt({ token, user }: any) {
      // Add user ID to the JWT token
      if (user) {
        token.id = user.id;
        token.discordId = user.discordId;
        token.roles = user.roles || ['user'];
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
