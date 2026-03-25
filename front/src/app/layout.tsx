import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { HeroUIClientProvider } from '@/components/providers/HeroUIClientProvider';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';

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
					<AuthProvider>
						<CartProvider>
							<Header />
							{children}
							<Footer />
						</CartProvider>
					</AuthProvider>
				</HeroUIClientProvider>
			</body>
		</html>
	);
}
