import { useState, useEffect, useCallback } from 'react';
import { getEmployees } from '../../api';
import type { EmployeeAnomaly, PaginatedEmployees } from '../../types';

const EDU_LABELS: Record<number, string> = { 1: 'Di Bawah PT', 2: 'Perguruan Tinggi', 3: 'Sarjana', 4: 'Magister', 5: 'Doktor' };
const SAT_LABELS: Record<number, string> = { 1: 'Rendah', 2: 'Sedang', 3: 'Tinggi', 4: 'Sangat Tinggi' };
const WLB_LABELS: Record<number, string> = { 1: 'Buruk', 2: 'Baik', 3: 'Lebih Baik', 4: 'Terbaik' };
const PERF_LABELS: Record<number, string> = { 1: 'Rendah', 2: 'Baik', 3: 'Sangat Baik', 4: 'Luar Biasa' };
const TRAVEL_LABELS: Record<string, string> = { Travel_Rarely: 'Jarang', Travel_Frequently: 'Sering', 'Non-Travel': 'Tidak Pernah' };
const MARITAL_LABELS: Record<string, string> = { Single: 'Lajang', Married: 'Menikah', Divorced: 'Cerai' };

const selectCls =
  'h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300';

export default function EmployeeRawTable() {
  const [data, setData] = useState<PaginatedEmployees | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('id');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [department, setDepartment] = useState('');
  const [jobRole, setJobRole] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEmployees({
        page, perPage: 15, sort, order,
        department: department || undefined,
        jobRole: jobRole || undefined,
      });
      setData(res);
    } catch {
      setError('Gagal memuat data karyawan.');
    } finally { setLoading(false); }
  }, [page, sort, order, department, jobRole]);

  useEffect(() => { void load(); }, [load]);

  const handleSort = (col: string) => {
    const SORTABLE = new Set(['id', 'age', 'monthlyIncome', 'totalWorkingYears']);
    if (!SORTABLE.has(col)) return;
    if (sort === col) setOrder((o) => o === 'asc' ? 'desc' : 'asc');
    else { setSort(col); setOrder('asc'); }
    setPage(1);
  };

  const sortIcon = (col: string) => {
    if (sort !== col) return <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>;
    return <span className="ml-1 text-brand-500">{order === 'asc' ? '↑' : '↓'}</span>;
  };

  const SORTABLE = new Set(['id', 'age', 'monthlyIncome', 'dailyRate', 'hourlyRate', 'monthlyRate', 'totalWorkingYears', 'distanceFromHome', 'percentSalaryHike']);

  // Kolom diurutkan sesuai kepentingan fitur dalam model ML (dari shap_global_importance.csv)
  const COLUMNS = [
    { key: 'id',                    label: '#' },
    { key: 'department',            label: 'Departemen' },
    { key: 'jobRole',               label: 'Jabatan' },
    { key: 'jobLevel',              label: 'Level' },
    { key: 'age',                   label: 'Usia' },
    { key: 'gender',                label: 'Gender' },
    { key: 'maritalStatus',         label: 'Status Nikah' },
    { key: 'education',             label: 'Pendidikan' },
    { key: 'educationField',        label: 'Bidang Studi' },
    { key: 'monthlyIncome',         label: 'Gaji Bulanan' },
    { key: 'percentSalaryHike',     label: 'Kenaikan Gaji (%)' },
    { key: 'dailyRate',             label: 'Tarif/Hari ($)' },
    { key: 'hourlyRate',            label: 'Tarif/Jam ($)' },
    { key: 'monthlyRate',           label: 'Tarif Bulanan ($)' },
    { key: 'stockOptionLevel',      label: 'Opsi Saham' },
    { key: 'overTime',              label: 'Lembur' },
    { key: 'businessTravel',        label: 'Perjalanan Dinas' },
    { key: 'distanceFromHome',      label: 'Jarak ke Kantor (km)' },
    { key: 'totalWorkingYears',     label: 'Total Pengalaman (th)' },
    { key: 'numCompaniesWorked',    label: 'Perusahaan Sebelumnya' },
    { key: 'yearsAtCompany',        label: 'Di Perusahaan (th)' },
    { key: 'yearsInCurrentRole',    label: 'Di Jabatan Ini (th)' },
    { key: 'yearsSinceLastPromotion', label: 'Sejak Promosi (th)' },
    { key: 'yearsWithCurrManager',  label: 'Dgn Manajer (th)' },
    { key: 'trainingTimesLastYear', label: 'Pelatihan/Tahun' },
    { key: 'workLifeBalance',       label: 'Keseimbangan Kerja' },
    { key: 'jobInvolvement',        label: 'Keterlibatan Kerja' },
    { key: 'jobSatisfaction',       label: 'Kepuasan Kerja' },
    { key: 'environmentSatisfaction', label: 'Kepuasan Lingkungan' },
    { key: 'relationshipSatisfaction', label: 'Kepuasan Hubungan' },
    { key: 'performanceRating',     label: 'Penilaian Kinerja' },
    { key: 'attrition',             label: 'Attrisi' },
  ];

  const cellValue = (row: EmployeeAnomaly, key: string): React.ReactNode => {
    const numFmt = (v: number | undefined) => v != null ? `$${v.toLocaleString()}` : '—';
    switch (key) {
      case 'id': return <span className="text-gray-400">{row.id}</span>;
      case 'gender': return row.gender === 'Male' ? 'Laki-laki' : 'Perempuan';
      case 'maritalStatus': return MARITAL_LABELS[row.maritalStatus] ?? row.maritalStatus;
      case 'education': return EDU_LABELS[row.education] ?? row.education;
      case 'monthlyIncome': return <span className="font-mono">{numFmt(row.monthlyIncome)}</span>;
      case 'dailyRate': return <span className="font-mono">{numFmt(row.dailyRate)}</span>;
      case 'hourlyRate': return <span className="font-mono">{numFmt(row.hourlyRate)}</span>;
      case 'monthlyRate': return <span className="font-mono">{numFmt(row.monthlyRate)}</span>;
      case 'overTime': return row.overTime === 'Yes'
        ? <span className="font-medium text-warning-600 dark:text-warning-400">Ya</span>
        : <span className="text-gray-400">Tidak</span>;
      case 'businessTravel': return TRAVEL_LABELS[row.businessTravel] ?? row.businessTravel;
      case 'jobSatisfaction': return SAT_LABELS[row.jobSatisfaction] ?? row.jobSatisfaction;
      case 'environmentSatisfaction': return SAT_LABELS[row.environmentSatisfaction] ?? row.environmentSatisfaction;
      case 'relationshipSatisfaction': return SAT_LABELS[row.relationshipSatisfaction] ?? row.relationshipSatisfaction;
      case 'jobInvolvement': return SAT_LABELS[row.jobInvolvement] ?? row.jobInvolvement;
      case 'workLifeBalance': return WLB_LABELS[row.workLifeBalance] ?? row.workLifeBalance;
      case 'performanceRating': return PERF_LABELS[row.performanceRating] ?? row.performanceRating;
      case 'attrition': return row.attrition === 'Yes'
        ? <span className="text-error-500 font-medium">Ya (Keluar)</span>
        : <span className="text-gray-400">Tidak</span>;
      default: return String((row as unknown as Record<string, unknown>)[key] ?? '—');
    }
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <input
          className={selectCls + ' w-44'}
          placeholder="Filter departemen..."
          value={department}
          onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
        />
        <input
          className={selectCls + ' w-44'}
          placeholder="Filter jabatan..."
          value={jobRole}
          onChange={(e) => { setJobRole(e.target.value); setPage(1); }}
        />
        <button
          onClick={() => { setDepartment(''); setJobRole(''); setPage(1); }}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
        >
          Reset
        </button>
        {data && (
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-800 dark:text-white">{data.total}</span> karyawan ditemukan
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="custom-scrollbar max-w-full overflow-x-auto">
          <table className="min-w-[1200px] w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ${
                      SORTABLE.has(col.key) ? 'cursor-pointer hover:text-gray-800 dark:hover:text-white' : ''
                    }`}
                  >
                    {col.label}
                    {SORTABLE.has(col.key) && sortIcon(col.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="py-10 text-center text-sm text-gray-400">Memuat…</td>
                </tr>
              ) : (data?.items ?? []).map((row) => (
                <tr key={row.id} className="transition hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
                  {COLUMNS.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {cellValue(row, col.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <PageBtn disabled={page <= 1} onClick={() => setPage(1)}>«</PageBtn>
          <PageBtn disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</PageBtn>
          <span className="px-2 text-sm text-gray-600 dark:text-gray-400">
            Hal <span className="font-semibold text-gray-800 dark:text-white">{page}</span> / {data.pages}
          </span>
          <PageBtn disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>›</PageBtn>
          <PageBtn disabled={page >= data.pages} onClick={() => setPage(data.pages)}>»</PageBtn>
        </div>
      )}
    </div>
  );
}

function PageBtn({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-white/5"
    >
      {children}
    </button>
  );
}
