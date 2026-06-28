import { useState, type FormEvent } from 'react';
import { createEmployee, type CreateEmployeePayload } from '../../api';
import type { EmployeeAnomaly } from '../../types';
import RiskBadge from './RiskBadge';
import { ChevronRight, ChevronLeft, CheckCircle2, ChevronDown } from 'lucide-react';

interface Props {
  onSuccess: () => void;
}

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-200';
const labelCls = 'mb-2 block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider';

const DEFAULTS: Partial<CreateEmployeePayload> = {};

const STEPS = [
  { id: 1, title: 'Data Personal' },
  { id: 2, title: 'Posisi & Gaji' },
  { id: 3, title: 'Kepuasan & Kinerja' },
  { id: 4, title: 'Riwayat Karir' },
];

export default function AddEmployeePage({ onSuccess }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Partial<CreateEmployeePayload>>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EmployeeAnomaly | null>(null);

  const set = <K extends keyof CreateEmployeePayload>(key: K, value: CreateEmployeePayload[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      
      if (key === 'hourlyRate') {
        if (typeof value === 'number') {
          next.dailyRate = value * 8;
          next.monthlyRate = value * 160;
        } else {
          next.dailyRate = '' as any;
          next.monthlyRate = '' as any;
        }
      }
      
      return next;
    });
  };

  const numField = (key: keyof CreateEmployeePayload, label: string, min: number, max: number, placeholder?: string) => (
    <div>
      <label className={labelCls}>{label}</label>
      <input
        type="number" min={min} max={max}
        placeholder={placeholder}
        value={form[key] ?? ''}
        onChange={(e) => set(key, e.target.value ? (Number(e.target.value) as CreateEmployeePayload[typeof key]) : ('' as any))}
        className={inputCls}
      />
    </div>
  );

  const selectField = (key: keyof CreateEmployeePayload, label: string, options: string[]) => (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <select
          value={(form[key] as string) ?? ''}
          onChange={(e) => set(key, e.target.value as CreateEmployeePayload[typeof key])}
          className={`${inputCls} appearance-none pr-10 ${!form[key] ? 'text-gray-400' : ''}`}
        >
          <option value="" disabled>Pilih...</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
          <ChevronDown className="size-4.5" />
        </div>
      </div>
    </div>
  );

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      handleNext();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const requiredFields: (keyof CreateEmployeePayload)[] = [
        'age', 'businessTravel', 'department', 'distanceFromHome', 'education',
        'educationField', 'environmentSatisfaction', 'gender', 'jobInvolvement',
        'jobLevel', 'jobRole', 'jobSatisfaction', 'maritalStatus', 'monthlyIncome',
        'dailyRate', 'hourlyRate', 'monthlyRate', 'numCompaniesWorked', 'overTime',
        'percentSalaryHike', 'performanceRating', 'relationshipSatisfaction',
        'stockOptionLevel', 'totalWorkingYears', 'trainingTimesLastYear',
        'workLifeBalance', 'yearsAtCompany', 'yearsInCurrentRole',
        'yearsSinceLastPromotion', 'yearsWithCurrManager'
      ];
      
      const missing = requiredFields.filter(f => form[f] === undefined || form[f] === '');
      if (missing.length > 0) {
        const FIELD_NAMES: Record<string, string> = {
          age: 'Usia', businessTravel: 'Perjalanan Dinas', department: 'Departemen',
          distanceFromHome: 'Jarak ke Kantor', education: 'Tingkat Pendidikan', educationField: 'Bidang Studi',
          environmentSatisfaction: 'Kepuasan Lingkungan', gender: 'Gender', jobInvolvement: 'Keterlibatan Kerja',
          jobLevel: 'Level Pekerjaan', jobRole: 'Jabatan', jobSatisfaction: 'Kepuasan Kerja',
          maritalStatus: 'Status Pernikahan', monthlyIncome: 'Pendapatan Bulanan', dailyRate: 'Tarif Harian',
          hourlyRate: 'Tarif Per Jam', monthlyRate: 'Tarif Bulanan', numCompaniesWorked: 'Jumlah Perusahaan Sebelumnya',
          overTime: 'Status Lembur', percentSalaryHike: 'Kenaikan Gaji', performanceRating: 'Rating Kinerja',
          relationshipSatisfaction: 'Kepuasan Relasi', stockOptionLevel: 'Level Opsi Saham',
          totalWorkingYears: 'Total Pengalaman', trainingTimesLastYear: 'Jumlah Pelatihan',
          workLifeBalance: 'Work-Life Balance', yearsAtCompany: 'Lama di Perusahaan',
          yearsInCurrentRole: 'Lama di Posisi Saat Ini', yearsSinceLastPromotion: 'Waktu Sejak Promosi',
          yearsWithCurrManager: 'Lama dengan Manajer'
        };
        const missingNames = missing.map(f => FIELD_NAMES[f] || f).join(',');
        throw new Error(`MISSING:${missingNames}`);
      }

      const emp = await createEmployee(form as CreateEmployeePayload);
      setResult(emp);
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message ?? (err as Error).message ?? 'Gagal membuat karyawan.';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xl dark:border-gray-800 dark:bg-gray-950">
        
        {/* Stepper Header (Only show if not result) */}
        {!result && (
          <div className="bg-gray-50/50 px-6 sm:px-10 py-6 border-b border-gray-100 dark:bg-gray-900/50 dark:border-gray-800">
            <div className="flex items-center justify-between">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex flex-1 items-center">
                  <div className={`flex flex-col items-center gap-3 ${step === s.id ? 'opacity-100' : step > s.id ? 'opacity-80' : 'opacity-40'}`}>
                    <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 text-sm font-bold transition-all ${
                      step >= s.id 
                        ? 'border-brand-500 bg-brand-500 text-white shadow-md shadow-brand-500/20' 
                        : 'border-gray-300 text-gray-500 dark:border-gray-700'
                    }`}>
                      {step > s.id ? <CheckCircle2 className="size-5 sm:size-6" /> : s.id}
                    </div>
                    <span className={`hidden sm:block text-[11px] font-bold uppercase tracking-widest ${
                      step >= s.id ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'
                    }`}>
                      {s.title}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`mx-4 sm:mx-8 h-1 flex-1 rounded-full transition-colors ${
                      step > s.id ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-800'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form / Content Area */}
        <div className="p-6 sm:p-10">
          {/* Result banner */}
          {result && (
            <div className="mx-auto max-w-2xl text-center animate-in zoom-in-95 duration-500 py-10">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-success-100 text-success-600 dark:bg-success-500/20 dark:text-success-400 ring-8 ring-success-50 dark:ring-success-900/10">
                <CheckCircle2 className="size-12" />
              </div>
              <h3 className="text-2xl font-bold text-success-800 dark:text-success-400">Pendaftaran Berhasil!</h3>
              <p className="mt-2 text-base text-success-600 dark:text-success-500">Karyawan telah ditambahkan dan dievaluasi oleh sistem anomali ML.</p>
              
              <div className="mx-auto mt-10 rounded-2xl border border-success-200 bg-success-50 p-6 shadow-sm dark:border-success-500/20 dark:bg-gray-900 text-left">
                <div className="mb-4 flex items-center justify-between pb-4 border-b border-success-100 dark:border-success-900/30">
                  <span className="text-sm font-semibold text-gray-500">ID Karyawan</span>
                  <span className="font-mono text-base font-bold text-gray-800 dark:text-white">#{result.id}</span>
                </div>
                <div className="mb-4 flex items-center justify-between pb-4 border-b border-success-100 dark:border-success-900/30">
                  <span className="text-sm font-semibold text-gray-500">Anomaly Score</span>
                  <span className="font-mono text-base font-bold text-brand-600 dark:text-brand-400">{result.anomalyScoreIf.toFixed(4)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-500">Status Risiko</span>
                  <RiskBadge category={result.riskCategory} />
                </div>
              </div>

              <div className="mt-10 flex items-center justify-center gap-4">
                <button onClick={() => { setResult(null); setStep(1); setForm(DEFAULTS); }} className="rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                  Tambah Lagi
                </button>
                <button onClick={() => window.location.hash = '#tabel'} className="rounded-xl bg-success-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-success-500/20 transition hover:bg-success-700">
                  Lihat di Tabel Karyawan
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          {!result && (
            <div id="add-emp-form" className="block">
              {error && (
                <div className="mb-8 rounded-xl border border-error-200 bg-error-50 px-5 py-4 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400 animate-in fade-in">
                  <div className="font-bold mb-2">
                    {error.startsWith('MISSING:') 
                      ? 'Mohon lengkapi data yang masih kosong:' 
                      : 'Terjadi Kesalahan:'}
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {error.replace('MISSING:', '').split(',').map((err, i) => (
                      err.trim() ? <li key={i}>{err.trim()}</li> : null
                    ))}
                  </ul>
                </div>
              )}

              <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                {/* STEP 1 */}
                {step === 1 && (
                  <div className="space-y-8">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 pb-4 dark:border-gray-800">
                      Informasi Pribadi & Latar Belakang
                    </h3>
                    <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 md:grid-cols-3">
                      {numField('age', 'Usia', 18, 65, 'Contoh: 30')}
                      <div>
                        <label className={labelCls}>Gender</label>
                        <div className="flex h-[46px] items-center gap-6">
                          {['Male', 'Female'].map((opt) => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio" name="gender" value={opt} checked={form.gender === opt}
                                onChange={(e) => set('gender', e.target.value)}
                                className="size-4.5 text-brand-500 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700"
                              />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{opt === 'Male' ? 'Laki-laki' : 'Perempuan'}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Status Pernikahan</label>
                        <div className="flex h-[46px] items-center gap-5">
                          {[
                            { v: 'Single', l: 'Lajang' },
                            { v: 'Married', l: 'Menikah' },
                            { v: 'Divorced', l: 'Cerai' },
                          ].map((opt) => (
                            <label key={opt.v} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio" name="maritalStatus" value={opt.v} checked={form.maritalStatus === opt.v}
                                onChange={(e) => set('maritalStatus', e.target.value)}
                                className="size-4.5 text-brand-500 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700"
                              />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{opt.l}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {numField('distanceFromHome', 'Jarak Rumah ke Kantor (km)', 1, 30, 'Contoh: 5')}
                      <div>
                        <label className={labelCls}>Tingkat Pendidikan</label>
                        <select
                          value={form.education ?? ''}
                          onChange={(e) => set('education', Number(e.target.value))}
                          className="w-full h-[46px] rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-100 dark:focus:bg-gray-900 transition-all appearance-none"
                        >
                          <option value="" disabled>Pilih...</option>
                          <option value={1}>1 - Di Bawah Perguruan Tinggi</option>
                          <option value={2}>2 - Perguruan Tinggi</option>
                          <option value={3}>3 - Sarjana</option>
                          <option value={4}>4 - Magister</option>
                          <option value={5}>5 - Doktor</option>
                        </select>
                      </div>
                      {selectField('educationField', 'Bidang Studi', [
                        'Life Sciences', 'Medical', 'Marketing', 'Technical Degree', 'Human Resources', 'Other',
                      ])}
                    </div>
                  </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <div className="space-y-8">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 pb-4 dark:border-gray-800">
                      Penugasan Pekerjaan & Gaji
                    </h3>
                    <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 md:grid-cols-3">
                      {selectField('department', 'Departemen', ['Sales', 'Research & Development', 'Human Resources'])}
                      {selectField('jobRole', 'Peran Pekerjaan', [
                        'Sales Executive', 'Research Scientist', 'Laboratory Technician',
                        'Manufacturing Director', 'Healthcare Representative', 'Manager',
                        'Sales Representative', 'Research Director', 'Human Resources',
                      ])}
                      {numField('jobLevel', 'Level Jabatan (1-5)', 1, 5, 'Contoh: 2')}
                      {numField('hourlyRate', 'Tarif Per Jam ($)', 30, 100, 'Contoh: 65')}
                      {numField('dailyRate', 'Tarif Harian ($)', 100, 2000, 'Contoh: 520')}
                      {numField('monthlyRate', 'Tarif Bulanan ($)', 2000, 30000, 'Contoh: 10400')}
                      
                      <div className="md:col-span-2">
                        <label className={labelCls}>Frekuensi Perjalanan Dinas</label>
                        <div className="flex h-[46px] items-center gap-6">
                          {[
                            { v: 'Non-Travel', l: 'Tidak Pernah' },
                            { v: 'Travel_Rarely', l: 'Jarang (Rarely)' },
                            { v: 'Travel_Frequently', l: 'Sering (Frequently)' },
                          ].map((opt) => (
                            <label key={opt.v} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio" name="businessTravel" value={opt.v} checked={form.businessTravel === opt.v}
                                onChange={(e) => set('businessTravel', e.target.value)}
                                className="size-4.5 text-brand-500 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700"
                              />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{opt.l}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>Status Lembur</label>
                        <div className="flex h-[46px] items-center gap-6">
                          {['Yes', 'No'].map((opt) => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio" name="overTime" value={opt} checked={form.overTime === opt}
                                onChange={(e) => set('overTime', e.target.value)}
                                className="size-4.5 text-brand-500 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700"
                              />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{opt === 'Yes' ? 'Ya' : 'Tidak'}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {numField('monthlyIncome', 'Gaji Bulanan ($)', 1000, 100000, 'Contoh: 5000')}
                      {numField('percentSalaryHike', 'Persentase Kenaikan Gaji (%)', 11, 25, 'Contoh: 14')}
                      
                      <div>
                        <label className={labelCls}>Opsi Saham (0-3)</label>
                        <div className="flex h-[46px] items-center gap-5">
                          {['0','1','2','3'].map((opt) => (
                            <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio" name="stockOptionLevel" value={opt} checked={String(form.stockOptionLevel) === opt}
                                onChange={(e) => set('stockOptionLevel', Number(e.target.value))}
                                className="size-4.5 text-brand-500 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700"
                              />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <div className="space-y-8">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 pb-4 dark:border-gray-800">
                      Indikator Kepuasan & Kinerja
                    </h3>
                    <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 md:grid-cols-2">
                      {[
                        { k: 'jobSatisfaction', l: 'Kepuasan Kerja', opts: [{v:1,l:'1 - Rendah'},{v:2,l:'2 - Sedang'},{v:3,l:'3 - Tinggi'},{v:4,l:'4 - Sangat Tinggi'}] },
                        { k: 'environmentSatisfaction', l: 'Kepuasan Lingkungan', opts: [{v:1,l:'1 - Rendah'},{v:2,l:'2 - Sedang'},{v:3,l:'3 - Tinggi'},{v:4,l:'4 - Sangat Tinggi'}] },
                        { k: 'relationshipSatisfaction', l: 'Kepuasan Hubungan Kerja', opts: [{v:1,l:'1 - Rendah'},{v:2,l:'2 - Sedang'},{v:3,l:'3 - Tinggi'},{v:4,l:'4 - Sangat Tinggi'}] },
                        { k: 'workLifeBalance', l: 'Keseimbangan Hidup (WLB)', opts: [{v:1,l:'1 - Buruk'},{v:2,l:'2 - Baik'},{v:3,l:'3 - Lebih Baik'},{v:4,l:'4 - Terbaik'}] },
                        { k: 'jobInvolvement', l: 'Keterlibatan Kerja', opts: [{v:1,l:'1 - Rendah'},{v:2,l:'2 - Sedang'},{v:3,l:'3 - Tinggi'},{v:4,l:'4 - Sangat Tinggi'}] },
                        { k: 'performanceRating', l: 'Rating Kinerja', opts: [{v:1,l:'1 - Rendah'},{v:2,l:'2 - Baik'},{v:3,l:'3 - Sangat Baik'},{v:4,l:'4 - Luar Biasa'}] },
                      ].map((field) => (
                        <div key={field.k}>
                          <label className={labelCls}>{field.l}</label>
                          <div className="flex h-[46px] items-center gap-4 mt-1">
                            {field.opts.map((opt) => (
                              <label key={opt.v} className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio" name={field.k} value={opt.v} checked={form[field.k as keyof CreateEmployeePayload] === opt.v}
                                  onChange={(e) => set(field.k as keyof CreateEmployeePayload, Number(e.target.value))}
                                  className="size-4.5 text-brand-500 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700"
                                />
                                <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{opt.l}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div>
                        <label className={labelCls}>Status Attrition</label>
                        <div className="flex h-[46px] items-center gap-6">
                          {['Yes', 'No'].map((opt) => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio" name="attrition" value={opt} checked={form.attrition === opt}
                                onChange={() => set('attrition', opt as 'Yes' | 'No')}
                                className="size-4.5 text-brand-500 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700"
                              />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{opt === 'Yes' ? 'Ya (Keluar)' : 'Tidak'}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4 */}
                {step === 4 && (
                  <div className="space-y-8">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 pb-4 dark:border-gray-800">
                      Riwayat Pengalaman Karir
                    </h3>
                    <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 md:grid-cols-3">
                      {numField('totalWorkingYears', 'Total Pengalaman Kerja (Thn)', 0, 40, 'Contoh: 5')}
                      {numField('numCompaniesWorked', 'Jumlah Perusahaan Sebelumnya', 0, 9, 'Contoh: 1')}
                      {numField('yearsAtCompany', 'Lama di Perusahaan Saat Ini', 0, 40, 'Contoh: 3')}
                      {numField('yearsInCurrentRole', 'Lama di Posisi Saat Ini', 0, 20, 'Contoh: 2')}
                      {numField('yearsSinceLastPromotion', 'Waktu Sejak Promosi Terakhir', 0, 15, 'Contoh: 1')}
                      {numField('yearsWithCurrManager', 'Lama dengan Manajer Saat Ini', 0, 17, 'Contoh: 2')}
                      {numField('trainingTimesLastYear', 'Jumlah Pelatihan (Tahun Lalu)', 0, 6, 'Contoh: 3')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!result && (
          <div className="border-t border-gray-100 bg-gray-50/80 px-6 sm:px-10 py-6 dark:border-gray-800 dark:bg-gray-900/80">
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <button
                type="button"
                onClick={step === 1 ? () => window.location.hash = '#overview' : handlePrev}
                className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 shadow-sm"
              >
                {step === 1 ? (
                  'Batal & Kembali'
                ) : (
                  <>
                    <ChevronLeft className="size-4.5" /> Kembali
                  </>
                )}
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl bg-brand-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-500/30 transition hover:bg-brand-600 hover:-translate-y-0.5"
                >
                  Langkah Selanjutnya <ChevronRight className="size-4.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl bg-brand-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-500/30 transition hover:bg-brand-600 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <svg className="size-4.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Mengevaluasi Model...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4.5" /> Simpan Data & Evaluasi Risiko
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
