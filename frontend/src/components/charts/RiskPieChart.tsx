import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RISK_COLOR } from '../../constants/risk';
import type { RiskBucket, RiskCategory } from '../../types';

const RADIAN = Math.PI / 180;

interface LabelProps {
  cx?: number; cy?: number; midAngle?: number;
  innerRadius?: number; outerRadius?: number; percent?: number;
}

const renderLabel = (props: LabelProps) => {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export default function RiskPieChart({ data }: { data: RiskBucket[] }) {
  if (!data.length) {
    return <div className="py-10 text-center text-sm text-gray-400">Memuat…</div>;
  }
  const RISK_LABEL_MAP: Record<string, string> = {
    rendah: 'Perhatian Rendah',
    sedang: 'Perhatian Sedang',
    tinggi: 'Perhatian Tinggi',
  };
  const chartData = data.map((d) => ({
    name: RISK_LABEL_MAP[d.kategori] ?? (d.kategori.charAt(0).toUpperCase() + d.kategori.slice(1)),
    value: d.jumlah,
    kategori: d.kategori as RiskCategory,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" outerRadius={110} innerRadius={55} dataKey="value" label={renderLabel} labelLine={false}>
          {chartData.map((entry, idx) => (
            <Cell key={idx} fill={RISK_COLOR[entry.kategori] ?? '#465fff'} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value} karyawan`, String(name)]}
          contentStyle={{
            background: 'var(--color-gray-900)',
            border: '1px solid var(--color-gray-700)',
            borderRadius: 8, color: '#fff', fontSize: 12,
          }}
        />
        <Legend
          iconType="circle"
          formatter={(v: string) => <span className="text-xs text-gray-600 dark:text-gray-300">{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
