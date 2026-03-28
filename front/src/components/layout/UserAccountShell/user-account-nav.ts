import type { LucideIcon } from 'lucide-react';
import { Heart, MapPin, Package, Settings, User } from 'lucide-react';

export type UserAccountNavItem = {
	href: string;
	label: string;
	icon: LucideIcon;
};

export const USER_ACCOUNT_NAV_ITEMS: UserAccountNavItem[] = [
	{ href: '/account/profile', label: 'Editar datos', icon: User },
	{ href: '/account/addresses', label: 'Direcciones', icon: MapPin },
	{ href: '/account/favorites', label: 'Historial favoritos', icon: Heart },
	{ href: '/orders', label: 'Mis pedidos', icon: Package },
	{ href: '/account/settings', label: 'Configuración', icon: Settings },
];
