interface Props {
  label: string;
  value: number | string | undefined;
  sub?: string;
  color?: 'default' | 'rendah' | 'sedang' | 'tinggi';
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  onClick?: () => void;
  active?: boolean;
}

const ICON_BG: Record<NonNullable<Props['color']>, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
  rendah: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
  sedang: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400',
  tinggi: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
};

import { Activity } from 'lucide-react';

const DEFAULT_ICON = <Activity className="size-6" />;

export default function StatsCard({ label, value, sub, color = 'default', icon, trend, onClick, active }: Props) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border bg-white p-5 transition dark:bg-white/[0.03] md:p-6 ${
        active
          ? 'border-brand-500 ring-2 ring-brand-500/20 dark:border-brand-500'
          : 'border-gray-200 dark:border-gray-800'
      } ${onClick ? 'cursor-pointer hover:shadow-theme-md' : ''}`}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${ICON_BG[color]}`}>
        {icon ?? DEFAULT_ICON}
      </div>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-jakarta">{label}</span>
          <h4 className="mt-2 text-4xl font-extrabold text-gray-800 dark:text-white/90">
            {value ?? '—'}
          </h4>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              trend.positive
                ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
                : 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
