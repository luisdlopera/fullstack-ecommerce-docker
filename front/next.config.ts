import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
				pathname: '/**',
			},
		],
	},
	async redirects() {
		return [{ source: '/woman', destination: '/women', permanent: true }];
	},
};

export default nextConfig;
