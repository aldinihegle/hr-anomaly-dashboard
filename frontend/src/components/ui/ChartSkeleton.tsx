export default function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div 
      className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center border border-slate-200 dark:border-slate-700"
      style={{ height: `${height}px` }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-end gap-1.5 opacity-40">
          <div className="w-4 h-12 bg-slate-300 dark:bg-slate-600 rounded-t-sm"></div>
          <div className="w-4 h-24 bg-slate-300 dark:bg-slate-600 rounded-t-sm"></div>
          <div className="w-4 h-16 bg-slate-300 dark:bg-slate-600 rounded-t-sm"></div>
          <div className="w-4 h-32 bg-slate-300 dark:bg-slate-600 rounded-t-sm"></div>
          <div className="w-4 h-20 bg-slate-300 dark:bg-slate-600 rounded-t-sm"></div>
        </div>
        <span className="text-sm font-medium text-slate-400 dark:text-slate-500">Memuat Grafik...</span>
      </div>
    </div>
  );
}
