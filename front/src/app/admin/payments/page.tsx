'use client';

import { AdminPageHeader } from '@/features/admin';

export default function AdminPaymentsPage() {
	return (
		<>
			<AdminPageHeader title='Pagos' description='Supervisión de estado de cobros y conciliación.' />
			<section className='rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600'>
				Este módulo complementa el monitoreo de pagos disponible en órdenes.
			</section>
		</>
	);
}
