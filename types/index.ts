// Extend NextAuth types
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
	interface Session {
		user: {
			id: string;
			discordId: string;
			roles: string[];
		} & DefaultSession['user'];
	}
}

// API Response types
export interface ApiResponse<T> {
	data: T;
	success: boolean;
	message?: string;
}

export class ApiError extends Error {
	code: string;
	status: number;

	constructor(message: string, code: string = 'UNKNOWN_ERROR', status: number = 500) {
		super(message);
		this.name = 'ApiError';
		this.code = code;
		this.status = status;
	}
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	hasMore: boolean;
}

// League of Legends region types
export type Region =
	| 'br1' // Brazil
	| 'eun1' // Europe Nordic & East
	| 'euw1' // Europe West
	| 'jp1' // Japan
	| 'kr' // Korea
	| 'la1' // Latin America North
	| 'la2' // Latin America South
	| 'na1' // North America
	| 'oc1' // Oceania
	| 'tr1' // Turkey
	| 'ru' // Russia
	| 'ph2' // Philippines
	| 'sg2' // Singapore
	| 'th2' // Thailand
	| 'tw2' // Taiwan
	| 'vn2'; // Vietnam

export const RegionNames: Record<Region, string> = {
	br1: 'Brazil',
	eun1: 'Europe Nordic & East',
	euw1: 'Europe West',
	jp1: 'Japan',
	kr: 'Korea',
	la1: 'Latin America North',
	la2: 'Latin America South',
	na1: 'North America',
	oc1: 'Oceania',
	tr1: 'Turkey',
	ru: 'Russia',
	ph2: 'Philippines',
	sg2: 'Singapore',
	th2: 'Thailand',
	tw2: 'Taiwan',
	vn2: 'Vietnam',
};

// Game modes
export type GameMode =
	| 'CLASSIC' // Summoner's Rift (Normal, Ranked)
	| 'ARAM' // All Random All Mid
	| 'URF' // Ultra Rapid Fire
	| 'ARURF' // All Random Ultra Rapid Fire
	| 'TFT' // Teamfight Tactics
	| 'ONEFORALL' // One For All
	| 'TUTORIAL' // Tutorial
	| 'NEXUSBLITZ' // Nexus Blitz
	| 'ULTBOOK' // Ultimate Spellbook
	| 'ARSR' // All Random Summoner's Rift
	| 'CHERRY' // Arena
	| 'PRACTICETOOL' // Practice Tool
	| 'OTHER'; // Other game modes

export const GameModeNames: Record<GameMode, string> = {
	CLASSIC: "Summoner's Rift",
	ARAM: 'ARAM',
	URF: 'URF',
	ARURF: 'All Random URF',
	TFT: 'Teamfight Tactics',
	ONEFORALL: 'One For All',
	TUTORIAL: 'Tutorial',
	NEXUSBLITZ: 'Nexus Blitz',
	ULTBOOK: 'Ultimate Spellbook',
	ARSR: "All Random Summoner's Rift",
	CHERRY: 'Arena',
	PRACTICETOOL: 'Practice Tool',
	OTHER: 'Other',
};
