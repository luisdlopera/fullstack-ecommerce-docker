'use client';

const VARIANTS: Record<string, string> = {
  green: 'bg-green-50 text-green-700 border-green-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  gray: 'bg-gray-50 text-gray-700 border-gray-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200'
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'yellow',
  PAID: 'green',
  PROCESSING: 'blue',
  SHIPPED: 'purple',
  DELIVERED: 'green',
  CANCELLED: 'red',
  REFUNDED: 'orange'
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'yellow',
  PAID: 'green',
  FAILED: 'red',
  REFUNDED: 'orange'
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'red',
  ADMIN: 'purple',
  MANAGER: 'blue',
  SUPPORT: 'orange',
  USER: 'gray'
};

type StatusBadgeProps = {
  value: string;
  type?: 'order' | 'payment' | 'role' | 'custom';
  variant?: string;
};

export function StatusBadge({ value, type = 'custom', variant }: StatusBadgeProps) {
  let color = variant ?? 'gray';

  if (!variant) {
    switch (type) {
      case 'order':
        color = ORDER_STATUS_COLORS[value] ?? 'gray';
        break;
      case 'payment':
        color = PAYMENT_STATUS_COLORS[value] ?? 'gray';
        break;
      case 'role':
        color = ROLE_COLORS[value] ?? 'gray';
        break;
    }
  }

  const classes = VARIANTS[color] ?? VARIANTS.gray;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${classes}`}>
      {value.replace(/_/g, ' ')}
    </span>
  );
}
