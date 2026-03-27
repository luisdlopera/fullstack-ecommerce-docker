'use client';

import { HeroUIProvider } from '@heroui/system';

type HeroUIClientProviderProps = {
	children: React.ReactNode;
};

export function HeroUIClientProvider({ children }: HeroUIClientProviderProps) {
	return <HeroUIProvider>{children}</HeroUIProvider>;
}
