import { describe, expect, it } from 'vitest';
import { formatRoleLabel } from './format-role-label';

describe('formatRoleLabel', () => {
	it('formats known roles into natural labels', () => {
		expect(formatRoleLabel('USER')).toBe('Cliente');
		expect(formatRoleLabel('SUPER_ADMIN')).toBe('Super admin');
		expect(formatRoleLabel('ADMIN')).toBe('Administrador');
		expect(formatRoleLabel('MANAGER')).toBe('Gestor');
		expect(formatRoleLabel('SUPPORT')).toBe('Soporte');
	});

	it('formats unknown roles from snake case', () => {
		expect(formatRoleLabel('QUALITY_ASSURANCE')).toBe('Quality Assurance');
	});

	it('returns default label for empty role', () => {
		expect(formatRoleLabel('')).toBe('Usuario');
	});
});
