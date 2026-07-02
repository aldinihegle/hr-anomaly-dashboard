import { X, TrendingUp, DollarSign, Users } from 'lucide-react';
import type { EmployeeAnomaly } from '../../types';
import { RISK_COLOR, RISK_LABEL } from '../../constants/risk';

interface Props {
  employee: EmployeeAnomaly;
  allEmployees: EmployeeAnomaly[];
  onClose: () => void;
}

export default function IncomeContextModal({ employee, allEmployees, onClose }: Props) {
  // Aggregate stats
  const deptEmployees = allEmployees.filter((e) => e.department === employee.department);
  const avgDeptIncome = deptEmployees.length
    ? deptEmployees.reduce((acc, curr) => acc + curr.monthlyIncome, 0) / deptEmployees.length
    : 0;

  const ageEmployees = allEmployees.filter((e) => Math.abs(e.age - employee.age) <= 2);
  const avgAgeIncome = ageEmployees.length
    ? ageEmployees.reduce((acc, curr) => acc + curr.monthlyIncome, 0) / ageEmployees.length
    : 0;

  const incomeDiffAge = ((employee.monthlyIncome - avgAgeIncome) / avgAgeIncome) * 100;

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
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Konteks Kompensasi</h3>
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
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Jabatan & Usia</p>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-200">{employee.jobRole}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{employee.department} • {employee.age} Tahun</p>
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
                <DollarSign className="size-4 text-brand-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Gaji Aktual</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                ${employee.monthlyIncome.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="size-4 text-emerald-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Kenaikan Terakhir</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {employee.percentSalaryHike}%
              </p>
            </div>
          </div>

          {/* Comparisons */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="size-4 text-slate-400" /> Benchmark Internal
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">vs Rata-rata Departemen ({employee.department})</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">${Math.round(avgDeptIncome).toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-800">
                <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${Math.min((employee.monthlyIncome / avgDeptIncome) * 50, 100)}%` }}></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">vs Sebaya (Usia {employee.age - 2}-{employee.age + 2} thn)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">${Math.round(avgAgeIncome).toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-800">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min((employee.monthlyIncome / avgAgeIncome) * 50, 100)}%` }}></div>
              </div>
            </div>
          </div>

          {/* Narrative Insight */}
          <div className={`rounded-lg border p-4 ${
            employee.riskCategory === 'tinggi' 
              ? 'border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10' 
              : 'border-brand-100 bg-brand-50/50 dark:border-brand-900/30 dark:bg-brand-900/10'
          }`}>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <strong className="font-semibold">Insight AI:</strong> Gaji bulanan karyawan ini berada di level <strong>${employee.monthlyIncome.toLocaleString()}</strong>, yang mana {' '}
              {Math.abs(incomeDiffAge) > 10 ? (
                <span className={incomeDiffAge > 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>
                  {Math.abs(incomeDiffAge).toFixed(1)}% lebih {incomeDiffAge > 0 ? 'tinggi' : 'rendah'}
                </span>
              ) : (
                <span>relatif setara</span>
              )}
              {' '} dibandingkan rata-rata rekan sebayanya. Hal ini {employee.riskCategory === 'tinggi' ? 'menjadi salah satu sorotan sistem terkait anomali kompensasi yang perlu ditinjau ulang.' : 'tergolong normal dalam struktur kompensasi.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
