import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ShapFeature } from '../../types';

// Pemetaan fitur teknis → label HR-friendly (Indonesian)
const FEATURE_LABEL: Record<string, string> = {
  MonthlyIncome: 'Pendapatan Bulanan',
  Age: 'Usia',
  TotalWorkingYears: 'Total Pengalaman Kerja',
  YearsAtCompany: 'Masa Kerja di Perusahaan',
  YearsInCurrentRole: 'Lama di Jabatan Saat Ini',
  YearsSinceLastPromotion: 'Waktu Sejak Promosi',
  YearsWithCurrManager: 'Lama dengan Manajer',
  DistanceFromHome: 'Jarak Rumah ke Kantor',
  PercentSalaryHike: 'Kenaikan Gaji (%)',
  NumCompaniesWorked: 'Jml Perusahaan Sebelumnya',
  JobLevel: 'Level Jabatan',
  StockOptionLevel: 'Level Opsi Saham',
  TrainingTimesLastYear: 'Pelatihan Tahun Lalu',
  Education: 'Tingkat Pendidikan',
  JobSatisfaction: 'Kepuasan Kerja',
  EnvironmentSatisfaction: 'Kepuasan Lingkungan',
  RelationshipSatisfaction: 'Kepuasan Hubungan',
  WorkLifeBalance: 'Keseimbangan Kerja-Hidup',
  JobInvolvement: 'Keterlibatan Kerja',
  PerformanceRating: 'Penilaian Kinerja',
  OverTime_Yes: 'Lembur',
  'Department_Research & Development': 'Departemen: R&D',
  Department_Sales: 'Departemen: Sales',
  'Department_Human Resources': 'Departemen: HR',
  BusinessTravel_Travel_Frequently: 'Perjalanan Dinas: Sering',
  BusinessTravel_Travel_Rarely: 'Perjalanan Dinas: Jarang',
  MaritalStatus_Single: 'Status: Lajang',
  MaritalStatus_Married: 'Status: Menikah',
  Gender_Male: 'Gender: Laki-laki',
};
const shorten = (name: string) => FEATURE_LABEL[name] ?? (name.length <= 28 ? name : name.replace('_', ': '));

interface TooltipPayload {
  payload: ShapFeature;
  value: number;
}

const CustomTooltip = (props: { active?: boolean; payload?: readonly unknown[] }) => {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;
  const d = payload[0] as TooltipPayload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-theme-md dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-0.5 text-gray-500 dark:text-gray-400">{d.payload.feature}</div>
      <div className="font-semibold text-gray-800 dark:text-white">
        Kontribusi terhadap Anomali: <span className="font-mono">{d.value.toFixed(5)}</span>
      </div>
    </div>
  );
};

export default function ShapBarChart({ data }: { data: ShapFeature[] }) {
  if (!data.length) return <div className="py-10 text-center text-sm text-gray-400">Memuat…</div>;

  const sorted = [...data].sort((a, b) => a.meanAbsShap - b.meanAbsShap);

  return (
    <ResponsiveContainer width="100%" height={Math.max(260, sorted.length * 30)}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 20, right: 30, top: 4, bottom: 4 }}>
        <XAxis
          type="number"
          tickFormatter={(v: number) => v.toFixed(3)}
          tick={{ fontSize: 11 }}
          axisLine={{ stroke: 'currentColor', strokeOpacity: 0.15 }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="feature"
          tickFormatter={shorten}
          width={210}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(70,95,255,0.06)' }} />
        <Bar dataKey="meanAbsShap" radius={[0, 4, 4, 0]} name="Kontribusi terhadap Anomali">
          {sorted.map((_, i) => {
            // gradient brand-300 → brand-600
            const t = sorted.length > 1 ? i / (sorted.length - 1) : 1;
            const r = Math.round(156 + t * (54 - 156));
            const g = Math.round(185 + t * (65 - 185));
            const b = Math.round(255 + t * (245 - 255));
            return <Cell key={i} fill={`rgb(${r},${g},${b})`} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
