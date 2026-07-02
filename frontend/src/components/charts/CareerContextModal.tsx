import { X, Trophy, Clock, Target } from 'lucide-react';
import type { EmployeeAnomaly } from '../../types';
import { RISK_COLOR, RISK_LABEL } from '../../constants/risk';

interface Props {
  employee: EmployeeAnomaly;
  allEmployees: EmployeeAnomaly[];
  onClose: () => void;
}

export default function CareerContextModal({ employee, allEmployees, onClose }: Props) {
  // Aggregate stats
  const roleEmployees = allEmployees.filter((e) => e.jobRole === employee.jobRole);
  const avgPromotionRole = roleEmployees.length
    ? roleEmployees.reduce((acc, curr) => acc + curr.yearsSinceLastPromotion, 0) / roleEmployees.length
    : 0;

  const deptEmployees = allEmployees.filter((e) => e.department === employee.department);
  const avgPromotionDept = deptEmployees.length
    ? deptEmployees.reduce((acc, curr) => acc + curr.yearsSinceLastPromotion, 0) / deptEmployees.length
    : 0;

  const stagnationDiff = employee.yearsSinceLastPromotion - avgPromotionDept;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Konteks Stagnansi Karir</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">ID Karyawan: {employee.id}</p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Header Info */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Jabatan saat ini</p>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-200">{employee.jobRole}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Level {employee.jobLevel} • {employee.department}</p>
            </div>
            <div className="text-right">
              <span 
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm"
                style={{
                  backgroundColor: `${RISK_COLOR[employee.riskCategory]}15`,
                  color: RISK_COLOR[employee.riskCategory],
                  border: `1px solid ${RISK_COLOR[employee.riskCategory]}40`
                }}
              >
                {RISK_LABEL[employee.riskCategory]}
              </span>
            </div>
          </div>

          {/* Core Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="size-4 text-amber-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Menunggu Promosi</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {employee.yearsSinceLastPromotion} <span className="text-sm font-normal text-slate-500">Tahun</span>
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="size-4 text-emerald-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Rating Performa</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {employee.performanceRating} <span className="text-sm font-normal text-slate-500">/ 4</span>
              </p>
            </div>
          </div>

          {/* Comparisons */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="size-4 text-slate-400" /> Benchmark Internal Promosi
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">vs Rekan Jabatan ({employee.jobRole})</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{avgPromotionRole.toFixed(1)} thn</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-800">
                <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${Math.min((employee.yearsSinceLastPromotion / (avgPromotionRole || 1)) * 50, 100)}%` }}></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">vs Rata-rata Departemen ({employee.department})</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{avgPromotionDept.toFixed(1)} thn</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-800">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min((employee.yearsSinceLastPromotion / (avgPromotionDept || 1)) * 50, 100)}%` }}></div>
              </div>
            </div>
          </div>

          {/* Narrative Insight */}
          <div className={`rounded-lg border p-4 ${
            employee.riskCategory === 'tinggi' || stagnationDiff > 2
              ? 'border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10' 
              : 'border-brand-100 bg-brand-50/50 dark:border-brand-900/30 dark:bg-brand-900/10'
          }`}>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <strong className="font-semibold">Insight AI:</strong> Karyawan ini telah bekerja di perusahaan selama {employee.yearsAtCompany} tahun dan memiliki Rating Performa {employee.performanceRating}. 
              Namun, ia belum dipromosikan selama {employee.yearsSinceLastPromotion} tahun, yang mana {' '}
              {stagnationDiff > 0 ? (
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {stagnationDiff.toFixed(1)} tahun lebih lambat
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  lebih cepat/setara
                </span>
              )}
              {' '} dibandingkan rata-rata rekan departemennya. 
              {stagnationDiff > 2 && employee.performanceRating >= 3 ? ' Kombinasi performa tinggi dan stagnansi promosi ini adalah pemicu kuat untuk pengunduran diri (turnover)!' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
