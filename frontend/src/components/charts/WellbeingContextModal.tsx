import { X, HeartPulse, Activity } from 'lucide-react';
import type { EmployeeAnomaly } from '../../types';

interface Props {
  data: EmployeeAnomaly[];
  onClose: () => void;
}

export default function WellbeingContextModal({ data, onClose }: Props) {
  const calcAvg = (risk: 'rendah' | 'sedang' | 'tinggi', key: keyof EmployeeAnomaly) => {
    const filtered = data.filter((e) => e.riskCategory === risk);
    if (!filtered.length) return 0;
    const sum = filtered.reduce((acc, curr) => acc + (curr[key] as number), 0);
    return Number((sum / filtered.length).toFixed(2));
  };

  const metrics = [
    { key: 'jobSatisfaction', label: 'Kepuasan Kerja' },
    { key: 'environmentSatisfaction', label: 'Kepuasan Lingkungan' },
    { key: 'workLifeBalance', label: 'Work-Life Balance' },
    { key: 'jobInvolvement', label: 'Keterlibatan' },
    { key: 'relationshipSatisfaction', label: 'Relasi Kerja' },
  ];

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
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <HeartPulse className="size-5 text-rose-500" />
              Detail Kesejahteraan Karyawan
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-3 text-sm text-blue-800 dark:bg-blue-900/10 dark:border-blue-900/30 dark:text-blue-300">
            <span className="font-semibold block mb-1">Panduan Skor (1-4):</span>
            1 = Sangat Buruk, 2 = Buruk, 3 = Baik, 4 = Sangat Baik.
          </div>

          <div className="space-y-3">
            {metrics.map(m => {
              const normal = calcAvg('rendah', m.key as keyof EmployeeAnomaly);
              const kritis = calcAvg('tinggi', m.key as keyof EmployeeAnomaly);
              const diff = normal - kritis;
              const isBad = diff > 0;

              return (
                <div key={m.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50 gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{m.label}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>Normal: <strong className="text-emerald-600 dark:text-emerald-400">{normal}</strong></span>
                      <span>Kritis: <strong className="text-red-600 dark:text-red-400">{kritis}</strong></span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isBad 
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }`}>
                      <Activity className="size-3" />
                      {isBad ? `${diff.toFixed(2)} Poin Lebih Buruk` : `${Math.abs(diff).toFixed(2)} Poin Lebih Baik`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-lg border border-rose-100 bg-rose-50/50 p-4 dark:border-rose-900/30 dark:bg-rose-900/10">
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <strong className="font-semibold block mb-1">Kesimpulan AI:</strong>
              Karyawan dalam kelompok berisiko (Kritis) terbukti secara nyata merasa <strong>kurang sejahtera</strong> di tempat kerja. Angka "Lebih Buruk" yang semakin besar menunjukkan masalah serius yang mendesak HR untuk segera melakukan perbaikan kultur kerja atau relasi internal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
