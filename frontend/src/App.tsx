import { useState, useEffect, useRef } from 'react';
import AppLayout from './layout/AppLayout';
import { getSummary, getShapGlobal, getEmployees } from './api';
import type { Summary, ShapFeature, EmployeeAnomaly } from './types';
import StatsCard from './components/ui/StatsCard';
import Section from './components/ui/Section';
import RiskPieChart from './components/charts/RiskPieChart';
import ShapBarChart from './components/charts/ShapBarChart';
import ScoreHistogram from './components/charts/ScoreHistogram';
import ShapLocalPanel from './components/charts/ShapLocalPanel';
import AnomalyTable from './components/tables/AnomalyTable';
import AddEmployeeModal from './components/ui/AddEmployeeModal';

const ICONS = {
  users: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  alert: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  ),
  check: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  chart: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
};

export default function App() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [shap, setShap] = useState<ShapFeature[]>([]);
  const [topN, setTopN] = useState(10);
  const [allScores, setAllScores] = useState<number[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeAnomaly | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeRisk, setActiveRisk] = useState<string>('');
  const [scoreRange, setScoreRange] = useState<{ min: number; max: number } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [tableKey, setTableKey] = useState(0); // bump to force table re-fetch

  useEffect(() => {
    getSummary().then(setSummary).catch(() =>
      setError('Tidak dapat terhubung ke backend. Pastikan NestJS berjalan di port 3000.')
    );
  }, []);

  useEffect(() => {
    getShapGlobal(topN).then(setShap).catch(() => {});
  }, [topN]);

  useEffect(() => {
    getEmployees({ perPage: 2000, sort: 'id', order: 'asc' })
      .then((res) => setAllScores(res.items.map((e) => e.anomalyScoreIf)))
      .catch(() => {});
  }, []);

  const dist = summary?.riskDistribution ?? [];
  const stats = summary?.anomalyScoreStats;
  const byRisk = (cat: 'rendah' | 'sedang' | 'tinggi') => dist.find((d) => d.kategori === cat)?.jumlah;

  const sorted = [...allScores].sort((a, b) => a - b);
  const p90 = sorted[Math.floor(sorted.length * 0.90)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];

  const handleRiskCardClick = (cat: 'rendah' | 'sedang' | 'tinggi') => {
    const next = activeRisk === cat ? '' : cat;
    setActiveRisk(next);
    setScoreRange(null);
    setTimeout(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleHistogramBarClick = (min: number, max: number) => {
    setScoreRange((prev) =>
      prev && Math.abs(prev.min - min) < 1e-9 ? null : { min, max }
    );
    setActiveRisk('');
    setTimeout(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const clearExternalFilters = () => {
    setActiveRisk('');
    setScoreRange(null);
  };

  return (
    <AppLayout>
      {/* Page heading */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title-sm font-bold text-gray-800 dark:text-white/90">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Ringkasan deteksi anomali profil kinerja karyawan — IBM HR Analytics dataset (1.470 karyawan)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-500"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Tambah Karyawan
          </button>
          <span className="inline-flex items-center gap-2 rounded-full border border-success-200 bg-success-50 px-3 py-1 text-xs font-medium text-success-600 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success-500" />
            Model Aktif · IF + XGBoost-SHAP
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {/* Stats grid */}
      <section id="overview" className="mb-6 grid grid-cols-1 gap-4 scroll-mt-24 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Total Karyawan Dipantau" value={stats?.total} icon={ICONS.users} color="default" />
        <StatsCard
          label="Anomali Tinggi" value={byRisk('tinggi')} sub="Profil perlu ditinjau segera"
          icon={ICONS.alert} color="tinggi"
          onClick={() => handleRiskCardClick('tinggi')}
          active={activeRisk === 'tinggi'}
        />
        <StatsCard
          label="Anomali Sedang" value={byRisk('sedang')} sub="Profil perlu dipantau"
          icon={ICONS.chart} color="sedang"
          onClick={() => handleRiskCardClick('sedang')}
          active={activeRisk === 'sedang'}
        />
        <StatsCard
          label="Anomali Rendah" value={byRisk('rendah')} sub="Profil relatif umum"
          icon={ICONS.check} color="rendah"
          onClick={() => handleRiskCardClick('rendah')}
          active={activeRisk === 'rendah'}
        />
      </section>

      {/* Score statistics row */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard label="Rata-rata Skor Anomali" value={stats ? stats.mean.toFixed(4) : undefined} sub="Rata-rata seluruh karyawan" color="default" />
        <StatsCard label="Skor Anomali Minimum" value={stats ? stats.min.toFixed(4) : undefined} sub="Skor terendah dalam data" color="default" />
        <StatsCard label="Skor Anomali Maksimum" value={stats ? stats.max.toFixed(4) : undefined} sub="Skor tertinggi dalam data" color="default" />
      </section>

      {/* Charts row */}
      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div id="risiko" className="xl:col-span-5 scroll-mt-24">
          <Section
            title="Distribusi Tingkat Anomali Karyawan"
            desc="Pembagian karyawan berdasarkan threshold P90 / P95 anomaly score"
          >
            <RiskPieChart data={dist} />
          </Section>
        </div>

        <div id="shap" className="xl:col-span-7 scroll-mt-24">
          <Section
            title="Faktor Paling Berpengaruh terhadap Anomali"
            desc="Kontribusi rata-rata (Mean |SHAP|) dari setiap atribut terhadap deteksi anomali profil karyawan"
            action={
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">Top</span>
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setTopN(n)}
                    className={`h-7 min-w-[32px] rounded-md px-2 text-xs font-medium transition ${
                      topN === n
                        ? 'bg-brand-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            }
          >
            <ShapBarChart data={shap} />
          </Section>
        </div>
      </div>

      {/* Histogram */}
      <div id="histogram" className="mb-6 scroll-mt-24">
        <Section
          title="Distribusi Skor Anomali Karyawan"
          desc="Histogram 30 bin berdasarkan skor Isolation Forest — biru: perhatian rendah · amber: perhatian sedang · merah: perhatian tinggi. Klik bin untuk filter tabel."
        >
          <ScoreHistogram
            scores={allScores}
            p90={p90}
            p95={p95}
            onBarClick={handleHistogramBarClick}
            selectedRange={scoreRange}
          />
        </Section>
      </div>

      {/* Table */}
      <div id="tabel" className="scroll-mt-24" ref={tableRef}>
        <Section
          title="Daftar Profil Karyawan Anomali"
          desc={
            activeRisk
              ? `Filter aktif: Anomali ${activeRisk} — klik kartu lagi atau tekan Reset untuk hapus`
              : scoreRange
              ? `Filter aktif: Skor ${scoreRange.min.toFixed(3)}–${scoreRange.max.toFixed(3)} — klik bar lagi atau tekan Reset untuk hapus`
              : 'Klik baris untuk melihat detail faktor penyebab anomali per karyawan'
          }
        >
          <AnomalyTable
            key={tableKey}
            filterRisk={activeRisk}
            scoreRange={scoreRange}
            onClearFilter={clearExternalFilters}
            onRowClick={(emp) => setSelectedEmp(emp)}
          />
        </Section>
      </div>

      {/* Local SHAP modal */}
      {selectedEmp && (
        <ShapLocalPanel employee={selectedEmp} onClose={() => setSelectedEmp(null)} />
      )}

      {/* Add Employee modal */}
      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setTableKey((k) => k + 1); // refresh table
            getSummary().then(setSummary).catch(() => {}); // refresh stats
          }}
        />
      )}

      {/* Disclaimer */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
        <span className="font-semibold">Catatan Interpretasi: </span>
        Hasil deteksi anomali ini merupakan indikator awal monitoring berbasis model Isolation Forest, bukan keputusan final HR. Profil dengan tingkat anomali tinggi menunjukkan kombinasi atribut yang tidak umum dibandingkan populasi data — bukan penilaian negatif terhadap karyawan. Tindak lanjut tetap memerlukan evaluasi dan pertimbangan HR.
      </div>
    </AppLayout>
  );
}
