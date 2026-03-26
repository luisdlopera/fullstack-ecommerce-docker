'use client';

import { Inbox } from 'lucide-react';

type EmptyStateProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
};

export function EmptyState({
  title = 'Sin datos',
  description = 'No hay información disponible aún.',
  action,
  icon
}: EmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16'>
      <div className='mb-4 rounded-full bg-gray-100 p-4'>
        {icon ?? <Inbox size={28} className='text-gray-400' />}
      </div>
      <h3 className='text-base font-semibold text-gray-800'>{title}</h3>
      <p className='mt-1 max-w-sm text-center text-sm text-gray-500'>{description}</p>
      {action && <div className='mt-4'>{action}</div>}
    </div>
  );
}
