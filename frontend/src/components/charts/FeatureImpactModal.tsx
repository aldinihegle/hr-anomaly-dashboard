import { X, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react';
import type { ShapFeature } from '../../types';

interface Props {
  feature: ShapFeature;
  onClose: () => void;
}

export default function FeatureImpactModal({ feature, onClose }: Props) {
  // Map SHAP features to human readable names and insights
  const featureMap: Record<string, { label: string; insight: string }> = {
    'TotalWorkingYears': {
      label: 'Masa Kerja di Perusahaan',
      insight: 'Karyawan yang sudah bekerja sangat lama namun tidak mengalami peningkatan karir yang proporsional cenderung merasa stagnan, yang secara drastis meningkatkan risiko pengunduran diri.'
    },
    'OverTime_Yes': {
      label: 'Sering Lembur',
      insight: 'Beban kerja berlebih dan jam lembur yang sangat tinggi adalah penyumbang utama kelelahan (burnout) yang bermuara pada risiko keluarnya karyawan.'
    },
    'JobRole_Sales Representative': {
      label: 'Jabatan: Sales Representative',
      insight: 'Posisi Sales seringkali memiliki target yang tinggi dan tekanan luar biasa. Tingkat stres di divisi ini secara historis memicu pergantian staf (turnover) yang tinggi.'
    },
    'MonthlyIncome': {
      label: 'Pendapatan Bulanan',
      insight: 'Ketidaksesuaian gaji dengan beban kerja atau pengalaman selalu menjadi faktor fundamental mengapa seorang karyawan mulai mencari peluang di luar perusahaan.'
    },
    'Age': {
      label: 'Usia Karyawan',
      insight: 'Karyawan yang sangat muda cenderung sering berpindah tempat kerja untuk mencari pengalaman, sementara karyawan senior lebih menginginkan stabilitas.'
    }
  };

  const getSeverity = (score: number) => {
    if (score >= 0.02) return { label: 'Kritis', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
    if (score >= 0.01) return { label: 'Penting', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' };
    return { label: 'Perhatian', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
  };

  const translateFeature = (name: string) => {
    let label = name;
    label = label.replace('JobRole_', 'Jabatan: ');
    label = label.replace('EducationField_', 'Bidang Studi: ');
    label = label.replace('BusinessTravel_', 'Dinas: ');
    label = label.replace('Department_', 'Departemen: ');
    label = label.replace('MaritalStatus_', 'Status: ');
    label = label.replace('Gender_', 'Gender: ');

    label = label.replace('Life Sciences', 'Ilmu Hayati');
    label = label.replace('Medical', 'Kesehatan');
    label = label.replace('Marketing', 'Pemasaran');
    label = label.replace('Technical Degree', 'Gelar Teknis');
    label = label.replace('Human Resources', 'HR');
    label = label.replace('Other', 'Lainnya');
    
    label = label.replace('Sales Executive', 'Eksekutif Sales');
    label = label.replace('Research Scientist', 'Ilmuwan Riset');
    label = label.replace('Laboratory Technician', 'Teknisi Lab');
    label = label.replace('Manufacturing Director', 'Direktur Manufaktur');
    label = label.replace('Healthcare Representative', 'Rep. Kesehatan');
    label = label.replace('Sales Representative', 'Rep. Sales');
    label = label.replace('Research Director', 'Direktur Riset');
    label = label.replace('Manager', 'Manajer');
    
    return label.replace(/_/g, ' ');
  };

  const info = featureMap[feature.feature] || {
    label: translateFeature(feature.feature),
    insight: `Fitur ini memiliki kontribusi matematis sebesar ${feature.meanAbsShap.toFixed(3)} dalam model AI. Perubahan pada metrik ini terbukti secara statistik memicu anomali atau risiko tinggi.`
  };

  const severity = getSeverity(feature.meanAbsShap);

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
              <AlertTriangle className="size-5 text-amber-500" />
              Konteks Akar Masalah
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Fitur Analitik</p>
            <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{info.label}</h4>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 flex items-center justify-between dark:border-slate-800 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <TrendingUp className="size-8 text-brand-500" />
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Skor Dampak AI (SHAP)</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {feature.meanAbsShap.toFixed(4)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${severity.color}`}>
                {severity.label}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-900/30 dark:bg-brand-900/10">
            <div className="flex gap-3">
              <Lightbulb className="size-5 text-brand-600 dark:text-brand-400 shrink-0" />
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                <strong className="font-semibold block mb-1">Insight & Rekomendasi HR:</strong>
                {info.insight}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
