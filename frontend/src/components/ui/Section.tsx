import type { ReactNode } from 'react';

interface SectionProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  desc?: string;
  id?: string;
  className?: string;
}

export default function Section({ title, children, action, desc, id, className = '' }: SectionProps) {
  return (
    <section
      id={id}
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3>
          {desc && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{desc}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      <div className="border-t border-gray-100 p-4 dark:border-gray-800 sm:p-6">{children}</div>
    </section>
  );
}
