import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UserAccountShell } from './UserAccountShell';

const mockUsePathname = vi.fn();
const mockReplace = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('next/navigation', () => ({
	usePathname: () => mockUsePathname(),
	useRouter: () => ({ replace: mockReplace }),
}));

vi.mock('@/contexts/AuthContext', () => ({
	useAuth: () => mockUseAuth(),
}));

describe('UserAccountShell integration', () => {
	it('renders account nav and active item for account route', () => {
		mockUsePathname.mockReturnValue('/account/profile');
		mockUseAuth.mockReturnValue({
			user: { id: 'u1', name: 'Ana', email: 'ana@test.com', role: 'SUPER_ADMIN' },
			loading: false,
			logout: vi.fn(),
		});

		render(
			<UserAccountShell>
				<div>Contenido</div>
			</UserAccountShell>,
		);

		expect(screen.getByText('Editar datos')).toBeVisible();
		expect(screen.getByText('Direcciones')).toBeVisible();
		expect(screen.getByText('Historial favoritos')).toBeVisible();
		expect(screen.getByText('Mis pedidos')).toBeVisible();
		expect(screen.getByText('Configuración')).toBeVisible();
		expect(screen.getByText('Contenido')).toBeVisible();
	});

	it('redirects unauthenticated users', () => {
		mockUsePathname.mockReturnValue('/account/profile');
		mockUseAuth.mockReturnValue({
			user: null,
			loading: false,
			logout: vi.fn(),
		});

		render(
			<UserAccountShell>
				<div>Contenido</div>
			</UserAccountShell>,
		);

		expect(mockReplace).toHaveBeenCalledWith('/auth');
	});
});
