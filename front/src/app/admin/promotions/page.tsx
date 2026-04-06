'use client';

import { AdminPageHeader } from '@/features/admin';

export default function AdminPromotionsPage() {
	return (
		<>
			<AdminPageHeader title='Promociones' description='Gestión de campañas y descuentos.' />
			<section className='rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600'>
				Este módulo está preparado para administrar reglas de promociones y cupones.
			</section>
		</>
	);
}
