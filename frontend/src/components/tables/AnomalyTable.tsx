import { useState, useEffect, useCallback } from 'react';
import { getEmployees, getDepartments, getJobRoles } from '../../api';
import type { EmployeeAnomaly, PaginatedEmployees } from '../../types';
import RiskBadge from '../ui/RiskBadge';

const fmt = (v: number | null | undefined, d = 4) => (v != null ? v.toFixed(d) : '—');

interface Column {
  key: keyof EmployeeAnomaly | 'actions';
  label: string;
  sortable?: boolean;
  className?: string;
  group: 'id' | 'ml' | 'raw';
}

// ML output columns: hasil olahan model
// raw columns: data mentah karyawan
const COLUMNS: Column[] = [
  { key: 'id',               label: '#',               sortable: true,  className: 'w-12', group: 'id' },
  { key: 'anomalyScoreIf',   label: 'Skor Anomali',    sortable: true,  group: 'ml' },
  { key: 'riskCategory',     label: 'Tingkat Risiko',                   group: 'ml' },
  { key: 'department',       label: 'Departemen',                       group: 'raw' },
  { key: 'jobRole',          label: 'Jabatan',                          group: 'raw' },
  { key: 'age',              label: 'Usia',             sortable: true,  group: 'raw' },
  { key: 'gender',           label: 'Gender',                           group: 'raw' },
  { key: 'monthlyIncome',    label: 'Gaji Bulanan',     sortable: true,  group: 'raw' },
  { key: 'overTime',         label: 'Lembur',                           group: 'raw' },
  { key: 'attrition',        label: 'Attrisi',                          group: 'raw' },
  { key: 'totalWorkingYears',label: 'Pengalaman (th)',  sortable: true,  group: 'raw' },
];

const ML_COUNT  = COLUMNS.filter((c) => c.group === 'ml').length;
const RAW_COUNT = COLUMNS.filter((c) => c.group === 'raw').length;

const ALLOWED_SORT = new Set(['anomalyScoreIf', 'monthlyIncome', 'age', 'totalWorkingYears', 'id']);

interface Props {
  defaultRisk?: string;
  filterRisk?: string;
  scoreRange?: { min: number; max: number } | null;
  onClearFilter?: () => void;
  onRowClick?: (emp: EmployeeAnomaly) => void;
}

const selectCls =
  'h-9 w-full sm:w-auto rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300';

export default function AnomalyTable({ defaultRisk = '', filterRisk, scoreRange, onClearFilter, onRowClick }: Props) {
  const [data, setData] = useState<PaginatedEmployees | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [risk, setRisk] = useState(defaultRisk);
  const [sort, setSort] = useState('anomalyScoreIf');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [department, setDepartment] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [overTime, setOverTime] = useState('');
  const [scoreMin, setScoreMin] = useState<number | undefined>(undefined);
  const [scoreMax, setScoreMax] = useState<number | undefined>(undefined);
  const [departments, setDepartments] = useState<string[]>([]);
  const [jobRoles, setJobRoles] = useState<string[]>([]);

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => {});
    getJobRoles().then(setJobRoles).catch(() => {});
  }, []);

  // Sync external risk filter from parent (card clicks)
  useEffect(() => {
    if (filterRisk !== undefined) {
      setRisk(filterRisk);
      setPage(1);
    }
  }, [filterRisk]);

  // Sync external score range filter from parent (histogram clicks)
  useEffect(() => {
    setScoreMin(scoreRange?.min);
    setScoreMax(scoreRange?.max);
    setPage(1);
  }, [scoreRange]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEmployees({
        page, perPage: 10,
        risk: risk || undefined, sort, order,
        department: department || undefined,
        jobRole: jobRole || undefined,
        overTime: overTime || undefined,
        minScore: scoreMin,
        maxScore: scoreMax,
      });
      setData(res);
    } catch {
      setError('Gagal memuat data. Pastikan backend berjalan.');
    } finally { setLoading(false); }
  }, [page, risk, sort, order, department, jobRole, overTime, scoreMin, scoreMax]);

  useEffect(() => { void load(); }, [load]);

  const handleSort = (col: string) => {
    if (!ALLOWED_SORT.has(col)) return;
    if (sort === col) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSort(col); setOrder('desc'); }
    setPage(1);
  };

  const sortIcon = (col: string) => {
    if (sort !== col) return <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>;
    return <span className="ml-1 text-brand-500">{order === 'asc' ? '↑' : '↓'}</span>;
  };

  const resetFilters = () => {
    setRisk(''); setDepartment(''); setJobRole(''); setOverTime('');
    setScoreMin(undefined); setScoreMax(undefined);
    setPage(1);
    onClearFilter?.();
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5">
        <select className={selectCls} value={risk} onChange={(e) => { setRisk(e.target.value); setPage(1); }}>
          <option value="">Semua Tingkat Anomali</option>
          <option value="rendah">Perhatian Rendah</option>
          <option value="sedang">Perhatian Sedang</option>
          <option value="tinggi">Perhatian Tinggi</option>
        </select>
        <select className={selectCls} value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }}>
          <option value="">Semua Department</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className={selectCls} value={jobRole} onChange={(e) => { setJobRole(e.target.value); setPage(1); }}>
          <option value="">Semua Job Role</option>
          {jobRoles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className={selectCls} value={overTime} onChange={(e) => { setOverTime(e.target.value); setPage(1); }}>
          <option value="">Semua Status Lembur</option>
          <option value="Yes">Lembur: Ya</option>
          <option value="No">Lembur: Tidak</option>
        </select>
        <button
          onClick={resetFilters}
          className="h-9 w-full rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 sm:w-auto"
        >
          Reset
        </button>
        {scoreMin !== undefined && scoreMax !== undefined && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            Score: {scoreMin.toFixed(3)}–{scoreMax.toFixed(3)}
            <button
              onClick={() => { setScoreMin(undefined); setScoreMax(undefined); setPage(1); onClearFilter?.(); }}
              className="ml-0.5 text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
              aria-label="Hapus filter score"
            >
              ×
            </button>
          </span>
        )}
        {data && (
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-800 dark:text-white">{data.total}</span> profil ditemukan
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="custom-scrollbar max-w-full overflow-x-auto">
          <table className="min-w-[900px] w-full">
            <thead>
              {/* Baris 1: Group header — pemisah ML vs Data Mentah */}
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {/* Kolom # tidak punya group */}
                <th className="bg-gray-50 dark:bg-white/[0.02] px-4 py-1.5" />
                {/* Kolom Hasil Model ML */}
                <th
                  colSpan={ML_COUNT}
                  className="px-4 py-1.5 text-center text-[10px] font-bold uppercase tracking-widest text-brand-600 bg-brand-50 dark:bg-brand-500/10 dark:text-brand-400 border-x border-brand-200 dark:border-brand-500/30"
                >
                  ⚙ Hasil Model ML
                </th>
                {/* Kolom Data Mentah Karyawan */}
                <th
                  colSpan={RAW_COUNT}
                  className="px-4 py-1.5 text-center text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-50 dark:bg-white/[0.02] dark:text-gray-400"
                >
                  Data Karyawan
                </th>
              </tr>
              {/* Baris 2: Label kolom individual */}
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
                {COLUMNS.map((col) => (
                  <th
                    key={String(col.key)}
                    onClick={() => col.sortable && handleSort(String(col.key))}
                    className={`whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider ${
                      col.group === 'ml'
                        ? 'text-brand-500 bg-brand-50/60 dark:bg-brand-500/[0.05] dark:text-brand-400'
                        : 'text-gray-500 dark:text-gray-400'
                    } ${
                      col.sortable ? 'cursor-pointer hover:text-gray-800 dark:hover:text-white' : ''
                    } ${col.className ?? ''}`}
                  >
                    {col.label}
                    {col.sortable && sortIcon(String(col.key))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="py-10 text-center text-sm text-gray-400">
                    Memuat…
                  </td>
                </tr>
              ) : (data?.items ?? []).map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={`transition hover:bg-brand-50/60 dark:hover:bg-brand-500/[0.06] ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{row.id}</td>
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-brand-600 dark:text-brand-400">
                    {fmt(row.anomalyScoreIf)}
                  </td>
                  <td className="px-4 py-3"><RiskBadge category={row.riskCategory} /></td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.department}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.jobRole}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{row.age}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{row.gender}</td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-700 dark:text-gray-300">
                    ${row.monthlyIncome?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {row.overTime === 'Yes'
                      ? <span className="text-warning-600 dark:text-warning-400">Ya</span>
                      : <span className="text-gray-400">Tidak</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {row.attrition === 'Yes'
                      ? <span className="text-error-500">Ya</span>
                      : <span className="text-gray-400">Tidak</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{row.totalWorkingYears}</td>
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
