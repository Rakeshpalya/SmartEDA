import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme?: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate';
  badge?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'blue',
  badge,
  onClick,
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
      border: 'hover:border-blue-300 dark:hover:border-blue-800',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
      border: 'hover:border-purple-300 dark:hover:border-purple-800',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
      border: 'hover:border-emerald-300 dark:hover:border-emerald-800',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
      border: 'hover:border-amber-300 dark:hover:border-amber-800',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
      border: 'hover:border-rose-300 dark:hover:border-rose-800',
    },
    indigo: {
      bg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
      border: 'hover:border-indigo-300 dark:hover:border-indigo-800',
    },
    slate: {
      bg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      border: 'hover:border-slate-300 dark:hover:border-slate-700',
    },
  };

  const scheme = colorMap[colorScheme];

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-2xs transition-all duration-200 ${
        onClick ? `cursor-pointer ${scheme.border} hover:-translate-y-0.5 hover:shadow-md` : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
          {title}
        </span>
        <div className={`p-2 rounded-xl ${scheme.bg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {value}
        </span>
        {badge && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
};
