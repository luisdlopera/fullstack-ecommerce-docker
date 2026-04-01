export function formatRoleLabel(role: string): string {
	const normalized = role.trim().toUpperCase();
	if (!normalized) return 'Usuario';

	if (normalized === 'CUSTOMER') return 'Cliente';
	if (normalized === 'SUPER_ADMIN') return 'Super admin';
	if (normalized === 'ADMIN') return 'Administrador';
	if (normalized === 'MANAGER') return 'Gestor';
	if (normalized === 'SUPPORT') return 'Soporte';

	const words = normalized.toLowerCase().split('_');
	return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function getRoleBadgeClass(role: string): string {
	const normalized = role.trim().toUpperCase();
	if (normalized === 'SUPER_ADMIN') return 'bg-violet-100 text-violet-800';
	if (normalized === 'ADMIN') return 'bg-blue-100 text-blue-700';
	if (normalized === 'MANAGER') return 'bg-amber-100 text-amber-800';
	if (normalized === 'SUPPORT') return 'bg-teal-100 text-teal-800';
	if (normalized === 'CUSTOMER') return 'bg-green-100 text-green-700';
	
	return 'bg-gray-100 text-gray-700'; // fallback visual consistente
}
