'use client';

import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: { value: number; label: string };
};

export function StatCard({ title, value, icon: Icon, description, trend }: StatCardProps) {
  return (
    <div className='rounded-xl border border-gray-200 bg-white p-6'>
      <div className='flex items-center justify-between'>
        <p className='text-sm font-medium text-gray-500'>{title}</p>
        <div className='rounded-lg bg-gray-100 p-2'>
          <Icon size={18} className='text-gray-600' />
        </div>
      </div>
      <p className='mt-2 text-3xl font-bold text-gray-900'>{value}</p>
      {(description || trend) && (
        <div className='mt-2 flex items-center gap-2 text-xs'>
          {trend && (
            <span className={trend.value >= 0 ? 'text-green-600' : 'text-red-600'}>
              {trend.value >= 0 ? '+' : ''}{trend.value}%
            </span>
          )}
          {description && <span className='text-gray-500'>{description}</span>}
        </div>
      )}
    </div>
  );
}
