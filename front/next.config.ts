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
				protocol: 'http',
				hostname: 'localhost',
				port: '9000',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: '*.r2.cloudflarestorage.com',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: '*.r2.dev',
				pathname: '/**',
			},
		],
	},
	async redirects() {
		return [{ source: '/woman', destination: '/women', permanent: true }];
	},
};

export default nextConfig;
