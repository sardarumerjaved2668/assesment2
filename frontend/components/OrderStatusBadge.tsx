import React from 'react';
import { OrderStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface OrderStatusBadgeProps {
  status: OrderStatus | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  processing: {
    label: 'Processing',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  shipped: {
    label: 'Shipped',
    className: 'bg-violet-50 text-violet-700 border border-violet-200',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-50 text-red-700 border border-red-200',
  },
};

export default function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config =
    statusConfig[status] ?? {
      label: String(status || 'Unknown'),
      className: 'bg-gray-100 text-gray-700 border border-gray-200',
    };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
        config.className,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
