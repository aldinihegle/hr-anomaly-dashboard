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
const shorten = (name: string) => {
  if (FEATURE_LABEL[name]) return FEATURE_LABEL[name];
  
  // Handle generic categorical prefixes
  let label = name;
  label = label.replace('JobRole_', 'Jabatan: ');
  label = label.replace('EducationField_', 'Bidang Studi: ');
  label = label.replace('BusinessTravel_', 'Dinas: ');
  label = label.replace('Department_', 'Departemen: ');
  label = label.replace('MaritalStatus_', 'Status: ');
  label = label.replace('Gender_', 'Gender: ');

  // Translate specific field values
  label = label.replace('Life Sciences', 'Ilmu Hayati');
  label = label.replace('Medical', 'Kesehatan');
  label = label.replace('Marketing', 'Pemasaran');
  label = label.replace('Technical Degree', 'Gelar Teknis');
  label = label.replace('Other', 'Lainnya');
  label = label.replace('Human Resources', 'HR');

  label = label.replace('Sales Executive', 'Eksekutif Sales');
  label = label.replace('Research Scientist', 'Ilmuwan Riset');
  label = label.replace('Laboratory Technician', 'Teknisi Lab');
  label = label.replace('Manufacturing Director', 'Direktur Manufaktur');
  label = label.replace('Healthcare Representative', 'Rep. Kesehatan');
  label = label.replace('Manager', 'Manajer');
  label = label.replace('Sales Representative', 'Rep. Sales');
  label = label.replace('Research Director', 'Direktur Riset');

  return label.length <= 32 ? label : label.replace('_', ': ');
};
interface TooltipPayload {
  payload: ShapFeature;
  value: number;
}

const CustomTooltip = (props: { active?: boolean; payload?: readonly unknown[] }) => {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;
  const d = payload[0] as TooltipPayload;
  
  const getSeverity = (score: number) => {
    if (score >= 0.02) return { label: 'Kritis', color: 'text-red-600 dark:text-red-400' };
    if (score >= 0.01) return { label: 'Penting', color: 'text-amber-600 dark:text-amber-400' };
    return { label: 'Perhatian', color: 'text-blue-600 dark:text-blue-400' };
  };
  
  const severity = getSeverity(d.value);
  
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-theme-md dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-1 font-medium text-gray-800 dark:text-gray-200">{shorten(d.payload.feature)}</div>
      <div className="text-gray-500 dark:text-gray-400">
        Tingkat Risiko: <span className={`font-semibold ${severity.color}`}>{severity.label}</span>
      </div>
    </div>
  );
};

interface Props {
  data: ShapFeature[];
  onBarClick?: (feature: ShapFeature) => void;
}

export default function ShapBarChart({ data, onBarClick }: Props) {
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
        <Bar 
          dataKey="meanAbsShap" 
          radius={[0, 4, 4, 0]} 
          barSize={20}
          cursor="pointer"
          onClick={(dataPoint: any) => {
            const feature = dataPoint?.payload || dataPoint;
            if (feature && feature.feature) onBarClick?.(feature as ShapFeature);
          }}
          name="Kontribusi terhadap Anomali"
        >
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
