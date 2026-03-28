export function formatRoleLabel(role: string): string {
	const normalized = role.trim().toUpperCase();
	if (!normalized) return 'Usuario';

	if (normalized === 'USER') return 'Cliente';
	if (normalized === 'SUPER_ADMIN') return 'Super admin';
	if (normalized === 'ADMIN') return 'Administrador';
	if (normalized === 'MANAGER') return 'Gestor';
	if (normalized === 'SUPPORT') return 'Soporte';

	const words = normalized.toLowerCase().split('_');
	return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
