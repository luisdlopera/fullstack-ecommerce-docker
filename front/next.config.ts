import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
	turbopack: {
		root: path.resolve(configDir, '..'),
	},
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
