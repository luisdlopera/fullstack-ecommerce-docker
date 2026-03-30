'use client';

import { AdminPageHeader } from '@/features/admin';

export default function AdminInventoryPage() {
  return (
    <>
      <AdminPageHeader title='Inventario' description='Vista operativa de inventario para administración.' />
      <section className='rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600'>
        Este módulo está listo para conectar ajustes de stock y movimientos de inventario.
      </section>
    </>
  );
}
