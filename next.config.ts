import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		domains: [
			'via.placeholder.com',
			'cdn.discordapp.com', // Discord CDN for user avatars
			'ddragon.leagueoflegends.com', // Riot Games Data Dragon CDN
			'raw.communitydragon.org', // Community Dragon CDN (for assets not in Data Dragon)
		],
	},
};

export default nextConfig;
