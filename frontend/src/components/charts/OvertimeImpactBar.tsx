import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { EmployeeAnomaly, RiskCategory } from '../../types';
import { RISK_LABEL } from '../../constants/risk';

interface Props {
  data: EmployeeAnomaly[];
}

export default function OvertimeImpactBar({ data }: Props) {
  // Aggregate data by risk category
  const aggregated = {
    rendah: { category: 'rendah', Yes: 0, No: 0 },
    sedang: { category: 'sedang', Yes: 0, No: 0 },
    tinggi: { category: 'tinggi', Yes: 0, No: 0 },
  };

  data.forEach((emp) => {
    if (aggregated[emp.riskCategory]) {
      if (emp.overTime === 'Yes') aggregated[emp.riskCategory].Yes++;
      else aggregated[emp.riskCategory].No++;
    }
  });

  const chartData = [
    aggregated.rendah,
    aggregated.sedang,
    aggregated.tinggi,
  ].map((d) => {
    const total = d.Yes + d.No;
    return {
      name: RISK_LABEL[d.category as RiskCategory],
      'Lembur: Ya': total > 0 ? (d.Yes / total) * 100 : 0,
      'Lembur: Tidak': total > 0 ? (d.No / total) * 100 : 0,
      totalYes: d.Yes,
      totalNo: d.No,
    };
  });

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${v}%`} />
          <Tooltip
            cursor={{ fill: '#f3f4f6', opacity: 0.4 }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border border-gray-100 bg-white/95 p-3 shadow-theme-lg backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{label}</p>
                    {payload.map((entry: any) => (
                      <p key={entry.name} className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                        {entry.name}: {entry.value.toFixed(1)}% ({entry.payload[entry.name === 'Lembur: Ya' ? 'totalYes' : 'totalNo']} org)
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="Lembur: Ya" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} />
          <Bar dataKey="Lembur: Tidak" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
