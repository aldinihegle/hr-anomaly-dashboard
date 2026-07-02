import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { EmployeeAnomaly } from '../../types';

interface Props {
  data: EmployeeAnomaly[];
}

export default function TravelImpactChart({ data }: Props) {
  const agg: Record<string, { name: string; rendah: number; sedang: number; tinggi: number; total: number }> = {
    'Non-Travel': { name: 'Non-Travel', rendah: 0, sedang: 0, tinggi: 0, total: 0 },
    'Travel_Rarely': { name: 'Jarang (Rarely)', rendah: 0, sedang: 0, tinggi: 0, total: 0 },
    'Travel_Frequently': { name: 'Sering (Frequently)', rendah: 0, sedang: 0, tinggi: 0, total: 0 },
  };

  data.forEach((emp) => {
    const travel = emp.businessTravel;
    if (agg[travel]) {
      agg[travel][emp.riskCategory]++;
      agg[travel].total++;
    }
  });

  const chartData = [
    agg['Non-Travel'],
    agg['Travel_Rarely'],
    agg['Travel_Frequently'],
  ].map((d) => ({
    name: d.name,
    'Normal (Rendah)': d.total > 0 ? (d.rendah / d.total) * 100 : 0,
    'Perhatian (Sedang)': d.total > 0 ? (d.sedang / d.total) * 100 : 0,
    'Kritis (Tinggi)': d.total > 0 ? (d.tinggi / d.total) * 100 : 0,
    rawRendah: d.rendah,
    rawSedang: d.sedang,
    rawTinggi: d.tinggi,
  }));

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
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Dinas: {label}</p>
                    {payload.map((entry: any) => (
                      <p key={entry.name} className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                        {entry.name}: {entry.value.toFixed(1)}% ({entry.payload[entry.name === 'Normal (Rendah)' ? 'rawRendah' : entry.name === 'Perhatian (Sedang)' ? 'rawSedang' : 'rawTinggi']} org)
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar dataKey="Kritis (Tinggi)" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} />
          <Bar dataKey="Perhatian (Sedang)" stackId="a" fill="#f59e0b" />
          <Bar dataKey="Normal (Rendah)" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
