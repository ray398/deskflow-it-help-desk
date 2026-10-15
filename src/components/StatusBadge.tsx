import React from 'react';
import { TicketStatus, TicketPriority } from '../types.ts';

export function StatusBadge({ status }: { status: TicketStatus }) {
  const configs: Record<
    TicketStatus,
    { label: string; textClass: string; bgClass: string; borderClass: string }
  > = {
    open: {
      label: 'Open',
      textClass: 'text-amber-700',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-200',
    },
    in_progress: {
      label: 'In Progress',
      textClass: 'text-indigo-700',
      bgClass: 'bg-indigo-50',
      borderClass: 'border-indigo-200',
    },
    resolved: {
      label: 'Resolved',
      textClass: 'text-emerald-700',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-200',
    },
    closed: {
      label: 'Closed',
      textClass: 'text-slate-600',
      bgClass: 'bg-slate-100',
      borderClass: 'border-slate-200',
    },
  };

  const config = configs[status] || configs.open;

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
    >
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const configs: Record<
    TicketPriority,
    { label: string; textClass: string; bgClass: string; borderClass: string }
  > = {
    critical: {
      label: 'Critical',
      textClass: 'text-rose-700 font-semibold',
      bgClass: 'bg-rose-50',
      borderClass: 'border-rose-200',
    },
    high: {
      label: 'High',
      textClass: 'text-orange-700 font-medium',
      bgClass: 'bg-orange-50',
      borderClass: 'border-orange-200',
    },
    medium: {
      label: 'Medium',
      textClass: 'text-blue-700',
      bgClass: 'bg-blue-50',
      borderClass: 'border-blue-200',
    },
    low: {
      label: 'Low',
      textClass: 'text-slate-600',
      bgClass: 'bg-slate-50',
      borderClass: 'border-slate-200',
    },
  };

  const config = configs[priority] || configs.medium;

  return (
    <span
      className={`inline-flex items-center text-xs px-2 py-0.5 rounded border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
    >
      {config.label}
    </span>
  );
}
