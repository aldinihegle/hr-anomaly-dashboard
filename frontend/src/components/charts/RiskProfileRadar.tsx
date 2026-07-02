import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { EmployeeAnomaly } from '../../types';

interface Props {
  data: EmployeeAnomaly[];
}

export default function RiskProfileRadar({ data }: Props) {
  const calcAvg = (risk: 'rendah' | 'sedang' | 'tinggi', key: keyof EmployeeAnomaly) => {
    const filtered = data.filter((e) => e.riskCategory === risk);
    if (!filtered.length) return 0;
    const sum = filtered.reduce((acc, curr) => acc + (curr[key] as number), 0);
    return Number((sum / filtered.length).toFixed(2));
  };

  const chartData = [
    {
      subject: 'Kepuasan Kerja',
      'Normal (Hijau)': calcAvg('rendah', 'jobSatisfaction'),
      'Berisiko (Merah)': calcAvg('tinggi', 'jobSatisfaction'),
      fullMark: 4,
    },
    {
      subject: 'Kepuasan Lingkungan',
      'Normal (Hijau)': calcAvg('rendah', 'environmentSatisfaction'),
      'Berisiko (Merah)': calcAvg('tinggi', 'environmentSatisfaction'),
      fullMark: 4,
    },
    {
      subject: 'Keseimbangan Waktu',
      'Normal (Hijau)': calcAvg('rendah', 'workLifeBalance'),
      'Berisiko (Merah)': calcAvg('tinggi', 'workLifeBalance'),
      fullMark: 4,
    },
    {
      subject: 'Keterlibatan',
      'Normal (Hijau)': calcAvg('rendah', 'jobInvolvement'),
      'Berisiko (Merah)': calcAvg('tinggi', 'jobInvolvement'),
      fullMark: 4,
    },
    {
      subject: 'Relasi Kerja',
      'Normal (Hijau)': calcAvg('rendah', 'relationshipSatisfaction'),
      'Berisiko (Merah)': calcAvg('tinggi', 'relationshipSatisfaction'),
      fullMark: 4,
    },
  ];

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="#e5e7eb" className="dark:stroke-gray-800" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[1, 4]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ fontSize: '13px' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
          <Radar name="Normal (Hijau)" dataKey="Normal (Hijau)" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
          <Radar name="Berisiko (Merah)" dataKey="Berisiko (Merah)" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
