import type { Metadata } from 'next';
import { Urbanist } from 'next/font/google';
import './globals.css';
import { HeroUIProvider } from '@heroui/react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';

const urbanist = Urbanist({
	variable: '--font-urbanist',
	subsets: ['latin'],
	weight: ['400', '700'], // Asegúrate de incluir los pesos que necesitas
});

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
			<body
				className={`${urbanist.className} relative flex h-[2000px] min-h-screen flex-col bg-white antialiased`}
			>
				<HeroUIProvider>
					<Header />
					{children}
					<Footer />
				</HeroUIProvider>
			</body>
		</html>
	);
}
