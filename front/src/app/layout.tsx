import type { Metadata } from 'next';
import './globals.css';
import { HeroUIClientProvider } from '@/components/providers/HeroUIClientProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LayoutShell } from '@/components/shared/LayoutShell';

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
					<QueryProvider>
						<AuthProvider>
							<FavoritesProvider>
								<CartProvider>
									<LayoutShell>{children}</LayoutShell>
								</CartProvider>
							</FavoritesProvider>
						</AuthProvider>
					</QueryProvider>
				</HeroUIClientProvider>
			</body>
		</html>
	);
}
