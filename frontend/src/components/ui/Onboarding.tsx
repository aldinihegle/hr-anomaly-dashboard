import { useState } from 'react';
import { Database, BrainCircuit, AlertTriangle, Fingerprint, LayoutDashboard, CheckCircle2, ChevronRight, ChevronLeft, SearchCheck } from 'lucide-react';

const SLIDES = [
  {
    title: 'Deteksi Anomali Kinerja',
    subtitle: 'Pemantauan Cerdas Tanpa Bias',
    desc: 'Sistem cerdas ini bertugas memantau puluhan metrik kinerja dan mendeteksi profil karyawan yang perilakunya menyimpang secara signifikan dari tren mayoritas di perusahaan Anda.',
    features: [
      'Memantau performa secara otomatis 24/7 tanpa perlu intervensi manual.',
      'Bertindak sebagai asisten objektif untuk mengurangi bias manusia.',
      'Membantu HR melakukan tindakan preventif sebelum terjadi masalah serius.',
      'Menganalisis data dari berbagai dimensi kinerja secara bersamaan.'
    ],
    icon: <SearchCheck className="w-12 h-12 text-brand-500" />,
    color: 'brand'
  },
  {
    title: 'Data Sebagai Landasan',
    subtitle: 'Standarisasi Objektif & Komprehensif',
    desc: 'Kami menganalisis dataset historis yang utuh (seperti Overtime, Kepuasan Kerja, Jarak Rumah, dll) untuk memahami pola "normal" yang spesifik di lingkungan kerja Anda.',
    features: [
      'Data identifier spesifik (seperti EmployeeNumber) dibuang secara otomatis agar analisis 100% rahasia dan objektif.',
      'Setiap fitur kategorikal diubah menjadi format angka (One-Hot Encoding).',
      'Data dinormalisasi (StandardScaler) agar fitur bernilai besar tidak mendominasi.',
      'Mempelajari lebih dari sekadar KPI, tetapi melihat konteks profil secara menyeluruh.'
    ],
    icon: <Database className="w-12 h-12 text-slate-500" />,
    color: 'slate'
  },
  {
    title: 'Mesin Deteksi: Isolation Forest',
    subtitle: 'Unsupervised Machine Learning',
    desc: 'Jantung dari sistem ini adalah algoritma Isolation Forest. Alih-alih memprofilkan karyawan "normal", algoritma ini bekerja dengan cara "mengisolasi" profil yang aneh dan tidak wajar.',
    features: [
      'Berjalan sepenuhnya secara unsupervised (tanpa memerlukan label data manual).',
      'Profil yang paling cepat terisolasi dalam pohon keputusan akan mendapat Anomaly Score tertinggi.',
      'Sangat efektif menemukan data pencilan (outliers) di lingkungan data berdimensi tinggi.',
      'Skor mentah dikonversi ketat ke skala 0.0 hingga 1.0 agar sangat mudah dibaca.'
    ],
    icon: <BrainCircuit className="w-12 h-12 text-amber-500" />,
    color: 'amber'
  },
  {
    title: 'Kategori Risiko Terukur',
    subtitle: 'Persentil P90 & P95 (MCCV)',
    desc: 'Untuk menghindari peringatan palsu, skor anomali [0,1] dikategorikan berdasarkan persentil ambang batas ketat yang ditetapkan melalui evaluasi statistik mendalam.',
    features: [
      'Risiko Rendah: Skor di bawah persentil 90 (P90). Karyawan berkinerja normal.',
      'Risiko Sedang: Skor antara P90 hingga P95. Profil menunjukkan anomali minor yang patut dipantau.',
      'Risiko Tinggi: Skor di atas persentil 95 (P95). Segelintir karyawan (Top 5%) dengan anomali terekstrem.',
      'Ambang batas ini memastikan Anda hanya fokus pada kasus yang benar-benar mendesak.'
    ],
    icon: <AlertTriangle className="w-12 h-12 text-rose-500" />,
    color: 'rose'
  },
  {
    title: 'Transparan dengan SHAP',
    subtitle: 'AI Bukan Lagi Kotak Hitam',
    desc: 'Kami tidak sekadar memberikan label. Sistem menggunakan Surrogate XGBoost dan analisis TreeSHAP untuk merinci persis mengapa seseorang ditandai sebagai anomali.',
    features: [
      'Menghasilkan kontribusi nilai (SHAP Value) untuk setiap fitur per karyawan.',
      'Melihat dengan jelas faktor positif yang menahan risiko, dan faktor negatif yang memicu risiko.',
      'Tingkat presisi penjelasan (Fidelity) telah divalidasi > 80% dengan Monte Carlo Cross-Validation.',
      'Pengambilan keputusan 100% didukung transparansi data, bukan tebakan mesin.'
    ],
    icon: <Fingerprint className="w-12 h-12 text-emerald-500" />,
    color: 'emerald'
  },
  {
    title: 'Pusat Kendali di Ujung Jari',
    subtitle: 'Mulai Pantau Tim Anda',
    desc: 'Semua wawasan komputasi kompleks tersebut kini telah kami terjemahkan ke dalam satu antarmuka visual yang modern, interaktif, dan mudah digunakan.',
    features: [
      'Metrik ringkasan interaktif untuk memantau proporsi risiko kesehatan perusahaan Anda.',
      'Tabel pintar dengan filter multikriteria untuk mencari karyawan di divisi tertentu.',
      'Klik baris data karyawan untuk membongkar grafik SHAP Waterfall secara instan.',
      'Desain responsif yang dapat Anda akses kapan saja dan dari perangkat apa saja.'
    ],
    icon: <LayoutDashboard className="w-12 h-12 text-brand-500" />,
    color: 'brand'
  }
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < SLIDES.length - 1) setStep(step + 1);
    else onComplete();
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="flex min-h-screen w-full bg-white dark:bg-zinc-950 font-sans overflow-hidden">
      {/* Left Panel - Navigation & Context */}
      <div className="w-full lg:w-[40%] flex flex-col justify-between p-8 sm:p-12 xl:p-16 relative z-10 bg-white dark:bg-zinc-950 border-r border-slate-100 dark:border-zinc-900">
        
        {/* Header - Synced with Login.tsx */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-2xl font-bold font-jakarta text-slate-900 dark:text-white tracking-tight">HR Anomaly</span>
        </div>

        <div className="my-auto max-w-md pt-8 pb-4">
          {/* Step Indicators */}
          <div className="flex gap-2 mb-8">
            {SLIDES.map((_, i) => (
              <div 
                key={i} 
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-10 bg-brand-500' : 
                  i < step ? 'w-4 bg-brand-500/50' : 
                  'w-4 bg-slate-200 dark:bg-zinc-800'
                }`} 
              />
            ))}
          </div>
          <div className="text-sm font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-4">
            Bagian {step + 1} dari {SLIDES.length}
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold font-jakarta text-slate-900 dark:text-white mb-6 leading-[1.15]">
            {SLIDES[step].title}
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 font-inter font-medium leading-relaxed">
            {SLIDES[step].subtitle}
          </p>
        </div>

        <div className="flex items-center gap-4 mt-8">
          {step > 0 ? (
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300 font-semibold font-inter hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Kembali
            </button>
          ) : (
            <button 
              onClick={onComplete}
              className="px-6 py-3.5 rounded-xl text-slate-500 dark:text-slate-400 font-semibold font-inter hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors"
            >
              Lewati
            </button>
          )}
          <button 
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-zinc-900 font-semibold font-inter hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-lg ml-auto"
          >
            {step === SLIDES.length - 1 ? 'Mulai Sekarang' : 'Lanjut'}
            {step !== SLIDES.length - 1 && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Right Panel - Detailed Explanation Card */}
      <div className="hidden lg:flex w-[60%] bg-slate-50 dark:bg-zinc-900 items-center justify-center p-12 xl:p-20 relative overflow-hidden">
        {/* Dynamic Background Glow Based on Slide Color */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none transition-colors duration-700">
          <div className={`absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-3xl opacity-50 transition-colors duration-700 ${
            SLIDES[step].color === 'brand' ? 'bg-brand-500/10' :
            SLIDES[step].color === 'slate' ? 'bg-slate-500/10' :
            SLIDES[step].color === 'amber' ? 'bg-amber-500/10' :
            SLIDES[step].color === 'rose' ? 'bg-rose-500/10' :
            'bg-emerald-500/10'
          }`} />
          <div className={`absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-3xl opacity-50 transition-colors duration-700 ${
            SLIDES[step].color === 'brand' ? 'bg-indigo-500/10' :
            SLIDES[step].color === 'slate' ? 'bg-zinc-500/10' :
            SLIDES[step].color === 'amber' ? 'bg-yellow-500/10' :
            SLIDES[step].color === 'rose' ? 'bg-red-500/10' :
            'bg-teal-500/10'
          }`} />
        </div>

        <div className="w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-[2rem] shadow-xl border border-slate-100 dark:border-zinc-800 p-10 xl:p-14 relative z-10 flex flex-col min-h-[500px]">
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100 dark:border-zinc-800">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-500 ${
              SLIDES[step].color === 'brand' ? 'bg-brand-50 dark:bg-brand-500/10' :
              SLIDES[step].color === 'slate' ? 'bg-slate-50 dark:bg-slate-500/10' :
              SLIDES[step].color === 'amber' ? 'bg-amber-50 dark:bg-amber-500/10' :
              SLIDES[step].color === 'rose' ? 'bg-rose-50 dark:bg-rose-500/10' :
              'bg-emerald-50 dark:bg-emerald-500/10'
            }`}>
              {SLIDES[step].icon}
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-300 font-inter leading-relaxed">
              {SLIDES[step].desc}
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-6">
              Detail Penjelasan Singkat
            </h3>
            <div className="space-y-6">
              {SLIDES[step].features.map((feature, i) => (
                <div key={i} className="flex items-start gap-4 group">
                  <div className={`mt-0.5 shrink-0 transition-all duration-300 group-hover:scale-110 ${
                    SLIDES[step].color === 'brand' ? 'text-brand-500' :
                    SLIDES[step].color === 'slate' ? 'text-slate-500' :
                    SLIDES[step].color === 'amber' ? 'text-amber-500' :
                    SLIDES[step].color === 'rose' ? 'text-rose-500' :
                    'text-emerald-500'
                  }`}>
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 font-inter text-[1.05rem] leading-relaxed">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
