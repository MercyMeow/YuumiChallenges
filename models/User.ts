import { ObjectId } from 'mongodb';

/**
 * User model
 */
export interface User {
	_id?: ObjectId; // MongoDB ID
	discordId: string; // Discord ID
	username: string; // Username (from Discord)
	email?: string; // Email (optional, not collected by default)
	avatar?: string; // Avatar URL
	discriminator?: string; // Discord discriminator
	name?: string; // Display name
	riotAccounts?: RiotAccount[]; // Linked Riot accounts
	roles: string[]; // User roles (e.g., 'user', 'admin')
	preferences?: {
		// User preferences
		theme?: string; // UI theme
		language?: string; // Language preference
		notifications?: {
			// Notification preferences
			discord?: boolean; // Discord notifications
		};
	};
	stats?: {
		// User statistics
		challengesCompleted?: number; // Number of challenges completed
		challengesCreated?: number; // Number of challenges created
		totalPoints?: number; // Total points earned
	};
	createdAt: Date; // When the user was created
	updatedAt: Date; // When the user was last updated
}

/**
 * Riot Games account linked to a user
 */
export interface RiotAccount {
	summonerId: string; // Summoner ID from Riot API
	summonerName: string; // Summoner name
	region: string; // Region (e.g., NA1, EUW1)
	accountId: string; // Account ID from Riot API
	puuid: string; // PUUID from Riot API
	profileIconId?: number; // Profile icon ID
	summonerLevel?: number; // Summoner level
	verified: boolean; // Whether the account has been verified
	verifiedAt?: Date; // When the account was verified
	addedAt?: Date; // When the account was added
}

export const UserCollection = 'users';

/**
 * Helper functions for User model
 */
export const userHelpers = {
	/**
	 * Format user data for client-side consumption (remove sensitive data)
	 */
	formatUser: (user: User): Omit<User, '_id'> & { id: string } => {
		const { _id, ...userData } = user;
		return {
			id: _id?.toString() || '',
			...userData,
		};
	},

	/**
	 * Create a new user from Discord data
	 */
	createUser: (discordUser: any): Omit<User, '_id'> => {
		const now = new Date();
		return {
			discordId: discordUser.id,
			username: discordUser.username,
			name: discordUser.username || discordUser.name || 'User',
			email: discordUser.email, // This will be undefined if we don't request it
			avatar: discordUser.avatar || discordUser.image,
			discriminator: discordUser.discriminator,
			createdAt: now,
			updatedAt: now,
			riotAccounts: [],
			roles: ['user'],
			preferences: {
				theme: 'dark',
				language: 'en',
				notifications: {
					discord: true,
				},
			},
			stats: {
				challengesCompleted: 0,
				challengesCreated: 0,
				totalPoints: 0,
			},
		};
	},

	/**
	 * Create a new Riot account
	 */
	createRiotAccount: (riotData: any): RiotAccount => {
		return {
			summonerId: riotData.id,
			puuid: riotData.puuid,
			accountId: riotData.accountId,
			summonerName: riotData.name,
			region: riotData.region,
			profileIconId: riotData.profileIconId,
			summonerLevel: riotData.summonerLevel,
			verified: false,
			addedAt: new Date(),
		};
	},

	/**
	 * Check if a user has a specific role
	 */
	hasRole: (user: User, role: string | string[]): boolean => {
		if (Array.isArray(role)) {
			return role.some((r) => user.roles.includes(r));
		}
		return user.roles.includes(role);
	},

	/**
	 * Check if a user has a verified Riot account
	 */
	hasVerifiedRiotAccount: (user: User): boolean => {
		return user.riotAccounts?.some((account) => account.verified) || false;
	},
};
