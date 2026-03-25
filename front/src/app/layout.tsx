import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { HeroUIClientProvider } from '@/components/providers/HeroUIClientProvider';

export const metadata: Metadata = {
	title: 'Nexstore',
	description: 'Tu tienda de confianza',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<body className='relative flex min-h-screen flex-col bg-white antialiased'>
				<HeroUIClientProvider>
					<Header />
					{children}
					<Footer />
				</HeroUIClientProvider>
			</body>
		</html>
	);
}
