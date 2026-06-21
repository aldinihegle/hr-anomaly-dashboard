import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface Props {
  scores: number[];
  p90?: number;
  p95?: number;
  onBarClick?: (min: number, max: number) => void;
  selectedRange?: { min: number; max: number } | null;
}

const N_BINS = 30;

export default function ScoreHistogram({ scores, p90, p95, onBarClick, selectedRange }: Props) {
  if (!scores.length) {
    return <div className="py-10 text-center text-sm text-gray-400">Tidak ada data…</div>;
  }

  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const binSize = (max - min) / N_BINS || 1;

  const bins = Array.from({ length: N_BINS }, (_, i) => ({
    label: (min + i * binSize).toFixed(3),
    midpoint: min + (i + 0.5) * binSize,
    count: 0,
  }));

  scores.forEach((s) => {
    const idx = Math.min(Math.floor((s - min) / binSize), N_BINS - 1);
    bins[idx].count++;
  });

  const colorForBin = (mid: number) => {
    if (p95 != null && mid >= p95) return '#f04438'; // error-500
    if (p90 != null && mid >= p90) return '#f79009'; // warning-500
    return '#465fff'; // brand-500
  };

  const CustomTooltip = (props: { active?: boolean; payload?: readonly unknown[] }) => {
    const { active, payload } = props;
    if (!active || !payload?.length) return null;
    const d = (payload[0] as { payload: typeof bins[0] }).payload;
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-theme-md dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-0.5 text-gray-500 dark:text-gray-400">Score ≈ {d.midpoint.toFixed(3)}</div>
        <div className="font-semibold text-gray-800 dark:text-white">{d.count} karyawan</div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={bins} margin={{ left: 0, right: 16, top: 8, bottom: 4 }} barCategoryGap={1}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10 }}
          interval={5}
          axisLine={{ stroke: 'currentColor', strokeOpacity: 0.15 }}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(70,95,255,0.06)' }} />

        {p90 != null && (
          <ReferenceLine
            x={bins.find((b) => b.midpoint >= p90)?.label}
            stroke="#f79009"
            strokeDasharray="4 3"
            label={{ value: 'P90', position: 'insideTopRight', fill: '#f79009', fontSize: 10 }}
          />
        )}
        {p95 != null && (
          <ReferenceLine
            x={bins.find((b) => b.midpoint >= p95)?.label}
            stroke="#f04438"
            strokeDasharray="4 3"
            label={{ value: 'P95', position: 'insideTopRight', fill: '#f04438', fontSize: 10 }}
          />
        )}

        <Bar
          dataKey="count"
          radius={[3, 3, 0, 0]}
          cursor={onBarClick ? 'pointer' : undefined}
          onClick={(_data: unknown, index: number) => {
            const binLo = min + index * binSize;
            const binHi = min + (index + 1) * binSize;
            onBarClick?.(binLo, binHi);
          }}
        >
          {bins.map((b, i) => {
            const inRange = selectedRange
              ? b.midpoint >= selectedRange.min - 1e-9 && b.midpoint <= selectedRange.max + 1e-9
              : true;
            return (
              <Cell key={i} fill={colorForBin(b.midpoint)} fillOpacity={inRange ? 1 : 0.3} />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
