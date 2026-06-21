import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { getShapLocal } from '../../api';
import type { EmployeeAnomaly, ShapLocalEntry } from '../../types';
import RiskBadge from '../ui/RiskBadge';
import { RISK_DESC } from '../../constants/risk';

interface Props {
  employee: EmployeeAnomaly;
  onClose: () => void;
}

// ── Pemetaan fitur teknis → label HR-friendly ─────────────────────────────
const FEATURE_LABEL: Record<string, { label: string; desc: string }> = {
  MonthlyIncome:            { label: 'Pendapatan Bulanan',           desc: 'Pola kompensasi berbeda dari mayoritas profil serupa' },
  Age:                      { label: 'Usia',                         desc: 'Usia karyawan berkontribusi terhadap profil tidak umum' },
  TotalWorkingYears:        { label: 'Total Pengalaman Kerja',       desc: 'Lama pengalaman kerja memengaruhi pola profil' },
  YearsAtCompany:           { label: 'Masa Kerja di Perusahaan',     desc: 'Masa kerja berkontribusi terhadap perbedaan profil' },
  YearsInCurrentRole:       { label: 'Lama di Jabatan Saat Ini',     desc: 'Durasi di jabatan saat ini ikut membentuk profil' },
  YearsSinceLastPromotion:  { label: 'Waktu Sejak Promosi',          desc: 'Jarak waktu promosi terakhir memengaruhi sinyal profil' },
  YearsWithCurrManager:     { label: 'Lama dengan Manajer',          desc: 'Durasi kerja bersama manajer saat ini memengaruhi profil' },
  DistanceFromHome:         { label: 'Jarak Rumah ke Kantor',        desc: 'Jarak rumah ikut memengaruhi pola profil tidak umum' },
  PercentSalaryHike:        { label: 'Kenaikan Gaji (%)',            desc: 'Besaran kenaikan gaji berbeda dari pola mayoritas' },
  NumCompaniesWorked:       { label: 'Jumlah Perusahaan Sebelumnya', desc: 'Riwayat perpindahan kerja memengaruhi profil' },
  JobLevel:                 { label: 'Level Jabatan',                desc: 'Level jabatan berkontribusi terhadap ketidakwajaran profil' },
  StockOptionLevel:         { label: 'Level Opsi Saham',             desc: 'Kepemilikan opsi saham berbeda dari pola umum' },
  TrainingTimesLastYear:    { label: 'Pelatihan Tahun Lalu',         desc: 'Frekuensi pelatihan memengaruhi pola profil' },
  Education:                { label: 'Tingkat Pendidikan',           desc: 'Latar belakang pendidikan ikut membentuk profil' },
  JobSatisfaction:          { label: 'Kepuasan Kerja',               desc: 'Kepuasan kerja memengaruhi sinyal perhatian profil' },
  EnvironmentSatisfaction:  { label: 'Kepuasan Lingkungan',          desc: 'Kepuasan terhadap lingkungan kerja berkontribusi pada profil' },
  RelationshipSatisfaction: { label: 'Kepuasan Hubungan',            desc: 'Kualitas hubungan kerja ikut membentuk profil' },
  WorkLifeBalance:          { label: 'Keseimbangan Kerja-Hidup',     desc: 'Keseimbangan kerja dan kehidupan pribadi memengaruhi profil' },
  JobInvolvement:           { label: 'Keterlibatan Kerja',           desc: 'Tingkat keterlibatan dalam pekerjaan memengaruhi profil' },
  PerformanceRating:        { label: 'Penilaian Kinerja',            desc: 'Rating kinerja berbeda dari distribusi umum' },
  'OverTime_Yes':                      { label: 'Lembur',                     desc: 'Lembur menjadi faktor dominan pada profil ini' },
  'Department_Research & Development': { label: 'Departemen: R&D',            desc: 'Penugasan di R&D memengaruhi pola profil' },
  'Department_Sales':                  { label: 'Departemen: Sales',           desc: 'Penugasan di Sales memengaruhi pola profil' },
  'Department_Human Resources':        { label: 'Departemen: HR',             desc: 'Penugasan di HR memengaruhi pola profil' },
  'BusinessTravel_Travel_Frequently':  { label: 'Perjalanan Dinas: Sering',   desc: 'Frekuensi perjalanan dinas tinggi memengaruhi profil' },
  'BusinessTravel_Travel_Rarely':      { label: 'Perjalanan Dinas: Jarang',   desc: 'Frekuensi perjalanan dinas rendah memengaruhi profil' },
  'MaritalStatus_Single':              { label: 'Status: Lajang',             desc: 'Status pernikahan berkontribusi terhadap pola profil' },
  'MaritalStatus_Married':             { label: 'Status: Menikah',            desc: 'Status pernikahan berkontribusi terhadap pola profil' },
  'Gender_Male':                       { label: 'Gender: Laki-laki',          desc: 'Komposisi gender memengaruhi profil tidak umum' },
  'JobRole_Sales Executive':           { label: 'Jabatan: Sales Executive',   desc: 'Peran jabatan memengaruhi pola profil' },
  'JobRole_Research Scientist':        { label: 'Jabatan: Research Scientist',desc: 'Peran jabatan memengaruhi pola profil' },
  'JobRole_Laboratory Technician':     { label: 'Jabatan: Lab Technician',    desc: 'Peran jabatan memengaruhi pola profil' },
  'JobRole_Manufacturing Director':    { label: 'Jabatan: Manufacturing Dir', desc: 'Peran jabatan memengaruhi pola profil' },
  'JobRole_Healthcare Representative': { label: 'Jabatan: Healthcare Rep',    desc: 'Peran jabatan memengaruhi pola profil' },
  'JobRole_Manager':                   { label: 'Jabatan: Manager',           desc: 'Peran jabatan memengaruhi pola profil' },
  'JobRole_Sales Representative':      { label: 'Jabatan: Sales Rep',         desc: 'Peran jabatan memengaruhi pola profil' },
  'JobRole_Research Director':         { label: 'Jabatan: Research Director', desc: 'Peran jabatan memengaruhi pola profil' },
  'EducationField_Life Sciences':      { label: 'Bidang: Life Sciences',      desc: 'Latar bidang pendidikan memengaruhi profil' },
  'EducationField_Medical':            { label: 'Bidang: Medical',            desc: 'Latar bidang pendidikan memengaruhi profil' },
  'EducationField_Marketing':          { label: 'Bidang: Marketing',          desc: 'Latar bidang pendidikan memengaruhi profil' },
  'EducationField_Technical Degree':   { label: 'Bidang: Technical Degree',   desc: 'Latar bidang pendidikan memengaruhi profil' },
  'EducationField_Human Resources':    { label: 'Bidang: Human Resources',    desc: 'Latar bidang pendidikan memengaruhi profil' },
  'EducationField_Other':              { label: 'Bidang: Other',              desc: 'Latar bidang pendidikan memengaruhi profil' },
};

const getLabel = (feature: string) =>
  FEATURE_LABEL[feature]?.label ?? feature.replace(/_/g, ' ');

const getDesc = (feature: string) =>
  FEATURE_LABEL[feature]?.desc ?? `Fitur ${feature.replace(/_/g, ' ')} berkontribusi terhadap profil tidak umum`;

const RISK_NARASI: Record<'rendah' | 'sedang' | 'tinggi', string> = {
  rendah: 'Profil karyawan ini relatif umum dibandingkan populasi data. Tidak ada kombinasi atribut yang tampak mencolok secara signifikan.',
  sedang: 'Profil karyawan ini memiliki beberapa kombinasi atribut yang tidak umum dibandingkan mayoritas data. Faktor-faktor di bawah ini menjadi penyebab utama deteksi anomali.',
  tinggi: 'Profil karyawan ini termasuk dalam kelompok paling tidak lazim dibandingkan data karyawan lain. Hasil ini tidak menunjukkan kesalahan atau penilaian negatif — melainkan menjadi sinyal awal bagi HR untuk melakukan peninjauan lebih lanjut.',
};

export default function ShapLocalPanel({ employee, onClose }: Props) {
  const [data, setData] = useState<ShapLocalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTechnical, setShowTechnical] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getShapLocal(employee.id, 12)
      .then((rows) => setData([...rows].sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [employee.id]);

  useEffect(() => { load(); }, [load]);

  const risk = employee.riskCategory as 'rendah' | 'sedang' | 'tinggi';
  const top5 = data.slice(0, 5);

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-99999 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div>
            <h2 className="text-base font-bold text-gray-800 dark:text-white/90">
              Detail Penjelasan Profil Anomali — #{employee.id}
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">
              {employee.jobRole} · {employee.department}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-white"
            aria-label="Tutup"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Status Profil */}
          <div className={`rounded-xl border px-4 py-3 ${
            risk === 'tinggi'
              ? 'border-error-200 bg-error-50 dark:border-error-500/30 dark:bg-error-500/10'
              : risk === 'sedang'
              ? 'border-warning-200 bg-warning-50 dark:border-warning-500/30 dark:bg-warning-500/10'
              : 'border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10'
          }`}>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status Profil Anomali</span>
              <RiskBadge category={risk} />
            </div>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {RISK_NARASI[risk]}
            </p>
            {RISK_DESC && (
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {RISK_DESC[risk]}
              </p>
            )}
          </div>

          {/* Info ringkas */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Usia</div>
              <div className="mt-1 text-sm font-semibold text-gray-800 dark:text-white">{employee.age} th</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Pendapatan</div>
              <div className="mt-1 font-mono text-sm font-semibold text-gray-800 dark:text-white">
                ${employee.monthlyIncome?.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Lembur</div>
              <div className={`mt-1 text-sm font-semibold ${employee.overTime === 'Yes' ? 'text-warning-600 dark:text-warning-400' : 'text-gray-400'}`}>
                {employee.overTime === 'Yes' ? 'Ya' : 'Tidak'}
              </div>
            </div>
          </div>

          {/* Faktor Penjelas Utama */}
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400">Memuat faktor penjelas…</div>
          ) : data.length > 0 ? (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                Faktor Penjelas Utama Deteksi Anomali
              </h3>
              <p className="mb-3 text-xs text-gray-400">
                Faktor di bawah ini diidentifikasi oleh model sebagai penyebab profil karyawan ini terdeteksi sebagai anomali.&nbsp;
                <span className="font-medium text-error-500">Merah</span> = mendorong tingkat anomali lebih tinggi ·&nbsp;
                <span className="font-medium text-brand-500">Biru</span> = menekan ke arah normal.
              </p>

              {/* Top 5 tabel interpretatif */}
              <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                {top5.map((d, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 px-4 py-3 ${
                      i < top5.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                    }`}
                  >
                    <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${d.shapValue >= 0 ? 'bg-error-500' : 'bg-brand-500'}`} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {getLabel(d.feature)}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-400">{getDesc(d.feature)}</div>
                    </div>
                    <span className={`mt-0.5 shrink-0 text-xs font-semibold ${d.shapValue >= 0 ? 'text-error-500' : 'text-brand-500'}`}>
                      {d.shapValue >= 0 ? '↑ Menaikkan' : '↓ Menekan'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bar chart semua fitur */}
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Kontribusi Seluruh Faktor (Top 12)
              </h4>
              <ResponsiveContainer width="100%" height={Math.max(260, data.length * 28)}>
                <BarChart
                  layout="vertical"
                  data={data.map((d) => ({ ...d, label: getLabel(d.feature) }))}
                  margin={{ left: 4, right: 30, top: 4, bottom: 4 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10 }}
                    axisLine={{ stroke: 'currentColor', strokeOpacity: 0.15 }}
                    tickLine={false}
                    tickFormatter={(v: number) => v.toFixed(3)}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={175}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(70,95,255,0.06)' }}
                    content={(props: { active?: boolean; payload?: readonly unknown[] }) => {
                      const { active, payload } = props;
                      if (!active || !payload?.length) return null;
                      const d = (payload[0] as { payload: ShapLocalEntry & { label: string } }).payload;
                      return (
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-theme-md dark:border-gray-700 dark:bg-gray-900">
                          <div className="mb-0.5 font-semibold text-gray-800 dark:text-white">{d.label}</div>
                          <div className="text-gray-500">{getDesc(d.feature)}</div>
                          {showTechnical && (
                            <div className={`mt-1 font-mono font-semibold ${d.shapValue >= 0 ? 'text-error-500' : 'text-brand-500'}`}>
                              SHAP: {d.shapValue.toFixed(5)}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine x={0} stroke="currentColor" strokeOpacity={0.2} />
                  <Bar dataKey="shapValue" radius={[0, 3, 3, 0]}>
                    {data.map((d, i) => (
                      <Cell key={i} fill={d.shapValue >= 0 ? '#f04438' : '#465fff'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-400">Tidak ada data faktor penjelas</div>
          )}

          {/* Catatan HR */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-400">
            <span className="font-semibold text-gray-600 dark:text-gray-300">Catatan HR: </span>
            Hasil deteksi anomali ini merupakan indikator awal berbasis model, bukan keputusan final. Faktor-faktor di atas menunjukkan atribut yang membuat profil karyawan ini terlihat tidak umum dibandingkan populasi data — bukan penilaian kinerja atau perilaku.
          </div>

          {/* Detail teknis (opsional) */}
          <div>
            <button
              onClick={() => setShowTechnical((v) => !v)}
              className="text-xs text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline dark:hover:text-gray-200"
            >
              {showTechnical ? 'Sembunyikan' : 'Tampilkan'} detail teknis model
            </button>
            {showTechnical && (
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-white/[0.02]">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Anomaly Score (IF)</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold text-brand-600 dark:text-brand-400">
                    {employee.anomalyScoreIf.toFixed(4)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Kategori Teknis</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">
                    {employee.riskCategory}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Metode</div>
                  <div className="mt-0.5 text-xs text-gray-500">Isolation Forest + XGBoost-SHAP (TreeSHAP)</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
