import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'via.placeholder.com',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'cdn.discordapp.com',
				pathname: '/**',
				// Discord CDN for user avatars
			},
			{
				protocol: 'https',
				hostname: 'ddragon.leagueoflegends.com',
				pathname: '/**',
				// Riot Games Data Dragon CDN
			},
			{
				protocol: 'https',
				hostname: 'raw.communitydragon.org',
				pathname: '/**',
				// Community Dragon CDN (for assets not in Data Dragon)
			},
		],
	},
};

export default nextConfig;
