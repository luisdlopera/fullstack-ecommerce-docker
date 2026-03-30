'use client';

import { AdminPageHeader } from '@/features/admin';

export default function AdminAuditLogsPage() {
  return (
    <>
      <AdminPageHeader title='Audit Logs' description='Trazabilidad de acciones administrativas críticas.' />
      <section className='rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600'>
        Los eventos de auditoría ya se registran en backend para cambios de rol, estados de orden y borrado de producto.
      </section>
    </>
  );
}
