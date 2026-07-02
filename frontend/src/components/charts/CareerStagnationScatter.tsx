import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis } from 'recharts';
import type { EmployeeAnomaly } from '../../types';
import { RISK_COLOR, RISK_LABEL } from '../../constants/risk';

interface Props {
  data: EmployeeAnomaly[];
  onDotClick?: (emp: EmployeeAnomaly) => void;
}

export default function CareerStagnationScatter({ data, onDotClick }: Props) {
  // Sort data so 'tinggi' risk is rendered last (on top)
  const sortedData = [...data].sort((a, b) => {
    const order = { rendah: 1, sedang: 2, tinggi: 3 };
    return order[a.riskCategory] - order[b.riskCategory];
  });

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800" />
          <XAxis type="number" dataKey="yearsAtCompany" name="Lama Bekerja" tick={{ fontSize: 12 }} stroke="#9ca3af" domain={['dataMin - 1', 'dataMax + 1']} label={{ value: 'Lama Bekerja (Tahun)', position: 'insideBottom', offset: -10, fill: '#9ca3af', fontSize: 12 }} />
          <YAxis width={60} type="number" dataKey="yearsSinceLastPromotion" name="Sejak Promosi" tick={{ fontSize: 12 }} stroke="#9ca3af" label={{ value: 'Sejak Promosi (Th)', angle: -90, position: 'insideLeft', offset: 0, fill: '#9ca3af', fontSize: 12 }} />
          <ZAxis type="number" range={[40, 40]} />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }} 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload as EmployeeAnomaly;
                return (
                  <div className="rounded-lg border border-gray-100 bg-white/95 p-3 shadow-theme-lg backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">ID: {d.id}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Jabatan: {d.jobRole}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Lama di Perusahaan: {d.yearsAtCompany} th</p>
                    <p className="text-xs text-brand-600 dark:text-brand-400">Sejak Promosi Terakhir: {d.yearsSinceLastPromotion} th</p>
                    <p className="mt-1 text-xs font-bold" style={{ color: RISK_COLOR[d.riskCategory] }}>
                      {RISK_LABEL[d.riskCategory]}
                    </p>
                  </div>
                );
              }
              return null;
            }} 
          />
          <Scatter 
            data={sortedData} 
            fill="#8884d8" 
            cursor="pointer"
            isAnimationActive={false}
            onClick={(dataPoint: any) => {
              const emp = dataPoint?.payload || dataPoint;
              if (emp && emp.id) onDotClick?.(emp);
            }}
          >
            {sortedData.map((entry) => (
              <Cell key={`cell-${entry.id}`} fill={RISK_COLOR[entry.riskCategory]} opacity={entry.riskCategory === 'rendah' ? 0.3 : 1.0} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
