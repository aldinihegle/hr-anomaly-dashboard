import { RISK_LABEL } from '../../constants/risk';

type Risk = 'rendah' | 'sedang' | 'tinggi';

const STYLE: Record<Risk, string> = {
  rendah: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
  sedang: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400',
  tinggi: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
};

export default function RiskBadge({ category }: { category: Risk }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${STYLE[category]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {RISK_LABEL[category]}
    </span>
  );
}
