import { useState, type FormEvent } from 'react';
import { createEmployee, type CreateEmployeePayload } from '../../api';
import type { EmployeeAnomaly } from '../../types';
import RiskBadge from './RiskBadge';

interface Props {
  onClose: () => void;
  onCreated: (emp: EmployeeAnomaly) => void;
}

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300';
const labelCls = 'mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide';

const DEFAULTS: CreateEmployeePayload = {
  age: 30, businessTravel: 'Travel_Rarely', department: 'Sales',
  distanceFromHome: 5, education: 3, educationField: 'Life Sciences',
  environmentSatisfaction: 3, gender: 'Male', jobInvolvement: 3,
  jobLevel: 2, jobRole: 'Sales Executive', jobSatisfaction: 3,
  maritalStatus: 'Single', monthlyIncome: 5000, numCompaniesWorked: 1,
  overTime: 'No', percentSalaryHike: 14, performanceRating: 3,
  relationshipSatisfaction: 3, stockOptionLevel: 1, totalWorkingYears: 5,
  trainingTimesLastYear: 3, workLifeBalance: 3, yearsAtCompany: 3,
  yearsInCurrentRole: 2, yearsSinceLastPromotion: 1, yearsWithCurrManager: 2,
  attrition: 'No',
};

export default function AddEmployeeModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreateEmployeePayload>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EmployeeAnomaly | null>(null);

  const set = <K extends keyof CreateEmployeePayload>(key: K, value: CreateEmployeePayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const numField = (key: keyof CreateEmployeePayload, label: string, min: number, max: number) => (
    <div>
      <label className={labelCls}>{label}</label>
      <input
        type="number" min={min} max={max}
        value={form[key] as number}
        onChange={(e) => set(key, Number(e.target.value) as CreateEmployeePayload[typeof key])}
        className={inputCls}
      />
    </div>
  );

  const selectField = (key: keyof CreateEmployeePayload, label: string, options: string[]) => (
    <div>
      <label className={labelCls}>{label}</label>
      <select
        value={form[key] as string}
        onChange={(e) => set(key, e.target.value as CreateEmployeePayload[typeof key])}
        className={inputCls}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const emp = await createEmployee(form);
      setResult(emp);
      onCreated(emp);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message ?? (err as Error).message ?? 'Gagal membuat karyawan.';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-theme-xl dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div>
            <h2 className="text-base font-bold text-gray-800 dark:text-white">Tambah Karyawan Baru</h2>
            <p className="mt-0.5 text-xs text-gray-400">Anomaly score akan dihitung otomatis oleh model</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Result banner */}
        {result && (
          <div className="mx-6 mt-4 rounded-xl border border-success-200 bg-success-50 px-4 py-3 dark:border-success-500/30 dark:bg-success-500/10">
            <p className="text-sm font-semibold text-success-700 dark:text-success-400">Karyawan berhasil ditambahkan!</p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
              <span>ID: <strong className="text-gray-800 dark:text-white">{result.id}</strong></span>
              <span>IF Score: <strong className="font-mono text-brand-600 dark:text-brand-400">{result.anomalyScoreIf.toFixed(4)}</strong></span>
              <span>Risiko: <RiskBadge category={result.riskCategory} /></span>
            </div>
            <button onClick={onClose} className="mt-3 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
              Tutup & lihat di tabel →
            </button>
          </div>
        )}

        {/* Form */}
        {!result && (
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
            {error && (
              <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                {error}
              </div>
            )}

            {/* Section: Personal */}
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Data Personal</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {numField('age', 'Usia', 18, 65)}
              {selectField('gender', 'Gender', ['Male', 'Female'])}
              {selectField('maritalStatus', 'Status Pernikahan', ['Single', 'Married', 'Divorced'])}
              {selectField('education', 'Pendidikan (1-5)', ['1','2','3','4','5'])}
              {selectField('educationField', 'Bidang Pendidikan', [
                'Life Sciences', 'Medical', 'Marketing', 'Technical Degree', 'Human Resources', 'Other',
              ])}
              {numField('distanceFromHome', 'Jarak Rumah (km)', 1, 30)}
            </div>

            {/* Section: Pekerjaan */}
            <p className="pt-2 text-xs font-bold uppercase tracking-widest text-gray-400">Pekerjaan</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {selectField('department', 'Department', ['Sales', 'Research & Development', 'Human Resources'])}
              {selectField('jobRole', 'Job Role', [
                'Sales Executive', 'Research Scientist', 'Laboratory Technician',
                'Manufacturing Director', 'Healthcare Representative', 'Manager',
                'Sales Representative', 'Research Director', 'Human Resources',
              ])}
              {selectField('jobLevel', 'Job Level (1-5)', ['1','2','3','4','5'])}
              {selectField('businessTravel', 'Business Travel', ['Travel_Rarely', 'Travel_Frequently', 'Non-Travel'])}
              {selectField('overTime', 'OverTime', ['Yes', 'No'])}
              {selectField('attrition', 'Attrition', ['No', 'Yes'])}
            </div>

            {/* Section: Kompensasi */}
            <p className="pt-2 text-xs font-bold uppercase tracking-widest text-gray-400">Kompensasi</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {numField('monthlyIncome', 'Monthly Income ($)', 1000, 100000)}
              {selectField('percentSalaryHike', 'Salary Hike (%)', Array.from({length:15},(_,i)=>String(i+11)))}
              {selectField('stockOptionLevel', 'Stock Option (0-3)', ['0','1','2','3'])}
            </div>

            {/* Section: Kepuasan */}
            <p className="pt-2 text-xs font-bold uppercase tracking-widest text-gray-400">Kepuasan & Performa</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {selectField('jobSatisfaction', 'Job Satisfaction (1-4)', ['1','2','3','4'])}
              {selectField('environmentSatisfaction', 'Env Satisfaction (1-4)', ['1','2','3','4'])}
              {selectField('relationshipSatisfaction', 'Relationship Sat. (1-4)', ['1','2','3','4'])}
              {selectField('workLifeBalance', 'Work Life Balance (1-4)', ['1','2','3','4'])}
              {selectField('jobInvolvement', 'Job Involvement (1-4)', ['1','2','3','4'])}
              {selectField('performanceRating', 'Performance (3-4)', ['3','4'])}
            </div>

            {/* Section: Pengalaman */}
            <p className="pt-2 text-xs font-bold uppercase tracking-widest text-gray-400">Pengalaman Kerja</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {numField('totalWorkingYears', 'Total Working Yrs', 0, 40)}
              {numField('numCompaniesWorked', 'Num Companies', 0, 9)}
              {numField('yearsAtCompany', 'Yrs at Company', 0, 40)}
              {numField('yearsInCurrentRole', 'Yrs in Role', 0, 20)}
              {numField('yearsSinceLastPromotion', 'Yrs Since Promo', 0, 15)}
              {numField('yearsWithCurrManager', 'Yrs w/ Manager', 0, 17)}
              {numField('trainingTimesLastYear', 'Trainings/yr', 0, 6)}
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-white/5"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Menghitung…
                  </>
                ) : 'Tambah & Hitung Skor'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
