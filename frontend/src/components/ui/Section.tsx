import { useState, type ReactNode } from 'react';
import { Info, X } from 'lucide-react';

interface SectionProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  desc?: string;
  info?: ReactNode;
  id?: string;
  className?: string;
}

export default function Section({ title, children, action, desc, info, id, className = '' }: SectionProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <section
      id={id}
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold font-jakarta text-gray-800 dark:text-white/90">{title}</h3>
            {info && (
              <>
                <button 
                  onClick={() => setShowInfo(true)} 
                  className="flex items-center justify-center text-slate-400 hover:text-brand-500 transition-colors p-1"
                  title="Cara membaca grafik ini"
                >
                  <Info className="size-4" />
                </button>
                
                {showInfo && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div 
                      className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
                      onClick={() => setShowInfo(false)} 
                    />
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex justify-between items-start mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <Info className="size-5 text-brand-500" />
                          Panduan Membaca Grafik
                        </h4>
                        <button 
                          onClick={() => setShowInfo(false)} 
                          className="text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 rounded-full p-1.5 transition-colors"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                      <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                        {info}
                      </div>
                      <div className="mt-6 flex justify-end">
                        <button 
                          onClick={() => setShowInfo(false)}
                          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                          Mengerti
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          {desc && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{desc}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      <div className="border-t border-gray-100 p-4 dark:border-gray-800 sm:p-6">{children}</div>
    </section>
  );
}
