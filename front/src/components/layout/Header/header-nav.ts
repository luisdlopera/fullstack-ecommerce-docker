export const HEADER_NAV_ITEMS = [
	{ label: 'Inicio', path: '' },
	{ label: 'Nuevo', path: 'new' },
	{ label: 'Hombre', path: 'men' },
	{ label: 'Mujer', path: 'women' },
	{ label: 'Niños', path: 'kids' },
] as const;

export type HeaderNavItem = (typeof HEADER_NAV_ITEMS)[number];
