import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import type { EmployeeAnomaly } from '../../types';

interface Props {
  data: EmployeeAnomaly[];
}

export default function ScoreDistributionHistogram({ data }: Props) {
  // Create histogram bins
  const bins = new Array(20).fill(0).map((_, i) => ({
    min: i * 0.05,
    max: (i + 1) * 0.05,
    count: 0,
    label: `${(i * 0.05).toFixed(2)}-${((i + 1) * 0.05).toFixed(2)}`
  }));

  data.forEach((emp) => {
    const score = emp.anomalyScoreIf;
    const binIndex = Math.min(Math.floor(score / 0.05), 19);
    bins[binIndex].count++;
  });

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bins} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#9ca3af" angle={-45} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip
            cursor={{ fill: '#f3f4f6', opacity: 0.4 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className="rounded-lg border border-gray-100 bg-white/95 p-3 shadow-theme-lg backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Skor: {d.label}</p>
                    <p className="text-sm text-brand-600 dark:text-brand-400">Jumlah: {d.count} karyawan</p>
                  </div>
                );
              }
              return null;
            }}
          />
          {/* Reference lines for threshold P90=0.58, P95=0.64 approx */}
          <ReferenceLine x="0.55-0.60" stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'Batas Sedang', fill: '#f59e0b', fontSize: 10 }} />
          <ReferenceLine x="0.65-0.70" stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Batas Tinggi', fill: '#ef4444', fontSize: 10 }} />
          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
