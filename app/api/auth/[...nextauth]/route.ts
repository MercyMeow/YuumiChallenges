import NextAuth from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/db/mongodb-client';

// Define the scopes we need from Discord
// We only need 'identify' for username and ID, and 'guilds' to see what servers they are in
const scopes = ['identify', 'guilds'].join(' ');

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
		async session({ session, user, token }: any) {
			// Add only the data we need to the session
			if (session.user) {
				// Include only necessary user data
				session.user.id = user?.id || token?.id;
				session.user.discordId = user?.discordId || token?.discordId;
				session.user.username = user?.username || token?.username;
				session.user.roles = user?.roles || token?.roles || ['user'];
				session.user.guilds = user?.guilds || token?.guilds || [];

				// Explicitly remove email if it was included
				if (session.user.email) {
					delete session.user.email;
				}
			}
			return session;
		},
		async jwt({ token, user, account, profile }: any) {
			// Add only the data we need to the JWT token
			if (user) {
				token.id = user.id;
				token.discordId = user.discordId;
				token.username = user.username || user.name;
				token.roles = user.roles || ['user'];
			}

			// If we have Discord profile data, extract guilds information
			if (profile && account?.provider === 'discord') {
				// Store Discord username instead of full name
				token.username = profile.username;
				token.discordId = profile.id;

				// We'll fetch guilds in a separate API call if needed
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
		strategy: 'jwt',
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
	secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
