import { useState, useEffect } from 'react';
import AppLayout from './layout/AppLayout';
import { getSummary, getShapGlobal, getEmployees, getMe, markOnboardingDone } from './api';
import type { Summary, ShapFeature, EmployeeAnomaly } from './types';
import StatsCard from './components/ui/StatsCard';
import Section from './components/ui/Section';
import RiskPieChart from './components/charts/RiskPieChart';
import ShapBarChart from './components/charts/ShapBarChart';
import ScoreHistogram from './components/charts/ScoreHistogram';
import ShapLocalPanel from './components/charts/ShapLocalPanel';
import AnomalyTable from './components/tables/AnomalyTable';
import EmployeeRawTable from './components/tables/EmployeeRawTable';
import AddEmployeePage from './components/ui/AddEmployeePage';

import { Users, AlertTriangle, CheckCircle, BarChart2, Plus } from 'lucide-react';

import Login from './components/ui/Login';
import Onboarding from './components/ui/Onboarding';
import { toast } from 'sonner';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isInitializing, setIsInitializing] = useState(isAuthenticated);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  
  const getUserId = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr).id : '';
    } catch {
      return '';
    }
  };
  
  // Routing state
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#overview');

  const [summary, setSummary] = useState<Summary | null>(null);
  const [shap, setShap] = useState<ShapFeature[]>([]);
  const [topN, setTopN] = useState(10);
  const [allScores, setAllScores] = useState<number[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeAnomaly | null>(null);
  const [activeRisk, setActiveRisk] = useState<string>('');
  const [scoreRange, setScoreRange] = useState<{ min: number; max: number } | null>(null);
  const [tableKey, setTableKey] = useState(0); // bump to force table re-fetch

  useEffect(() => {
    const onHashChange = () => setCurrentHash(window.location.hash || '#overview');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (currentHash === '#onboarding') {
      const userId = getUserId();
      if (userId) localStorage.setItem(`onboarding_done_${userId}`, 'false');
      setHasCompletedOnboarding(false);
      window.location.hash = '#overview';
    }
  }, [currentHash]);

  useEffect(() => {
    if (isAuthenticated) {
      setIsInitializing(true);
      getMe().then(user => {
        localStorage.setItem('user', JSON.stringify(user));
        setHasCompletedOnboarding(user.onboardingDone === true);
      }).catch(e => {
        if (e?.response?.status === 401) {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      }).finally(() => {
        setIsInitializing(false);
      });
    } else {
      setIsInitializing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getSummary().then(setSummary).catch((e) => {
      if (e?.response?.status === 401) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      } else {
        toast.error('Tidak dapat terhubung ke backend. Pastikan API berjalan.');
      }
    });
  }, [isAuthenticated, tableKey]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getShapGlobal(topN).then(setShap).catch(() => {});
  }, [topN, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getEmployees({ perPage: 2000, sort: 'id', order: 'asc' })
      .then((res) => setAllScores(res.items.map((e) => e.anomalyScoreIf)))
      .catch(() => {});
  }, [isAuthenticated, tableKey]);

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
    window.location.hash = '#tabel';
  };

  const handleHistogramBarClick = (min: number, max: number) => {
    setScoreRange((prev) =>
      prev && Math.abs(prev.min - min) < 1e-9 ? null : { min, max }
    );
    setActiveRisk('');
    window.location.hash = '#tabel';
  };

  const clearExternalFilters = () => {
    setActiveRisk('');
    setScoreRange(null);
  };

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onSuccess={() => setIsAuthenticated(true)} />;
  }

  if (!hasCompletedOnboarding) {
    return (
      <Onboarding 
        onComplete={() => {
          markOnboardingDone().catch(console.error);
          setHasCompletedOnboarding(true);
        }} 
      />
    );
  }

  // Define Page Titles
  const getPageTitle = () => {
    switch (currentHash) {
      case '#overview': return 'Dashboard Overview';
      case '#risiko': return 'Distribusi Risiko';
      case '#shap': return 'SHAP Global Analysis';
      case '#histogram': return 'Histogram Skor Anomali';
      case '#karyawan': return 'Data Karyawan';
      case '#tabel': return 'Analisis Anomali';
      case '#tambah': return 'Tambah Data Karyawan';
      default: return 'Dashboard Overview';
    }
  };

  return (
    <AppLayout>
      {/* Page heading */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-jakarta text-slate-900 dark:text-white">
            {getPageTitle()}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 font-inter">
            {currentHash === '#tambah' 
              ? 'Lengkapi formulir di bawah ini untuk menambahkan dan mengevaluasi profil karyawan baru.'
              : 'Pantau ringkasan tingkat risiko dan deteksi anomali pada profil karyawan Anda.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {currentHash !== '#tambah' && (
            <button
              onClick={() => window.location.hash = '#tambah'}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 hover:-translate-y-0.5 dark:bg-brand-600 dark:hover:bg-brand-500"
            >
              <Plus className="size-4" />
              Tambah Karyawan
            </button>
          )}
        </div>
      </div>

      {/* OVERVIEW PAGE */}
      {(currentHash === '#overview' || currentHash === '') && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <section id="overview" className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatsCard label="Total Karyawan Dipantau" value={stats?.total} icon={<Users className="size-5 md:size-6" />} color="default" />
            <StatsCard
              label="Risiko Tinggi" value={byRisk('tinggi')} sub="Butuh tinjauan segera"
              icon={<AlertTriangle className="size-5 md:size-6" />} color="tinggi"
              onClick={() => handleRiskCardClick('tinggi')}
              active={activeRisk === 'tinggi'}
            />
            <StatsCard
              label="Risiko Sedang" value={byRisk('sedang')} sub="Perlu mulai dipantau"
              icon={<BarChart2 className="size-5 md:size-6" />} color="sedang"
              onClick={() => handleRiskCardClick('sedang')}
              active={activeRisk === 'sedang'}
            />
            <StatsCard
              label="Risiko Rendah" value={byRisk('rendah')} sub="Kondisi stabil & normal"
              icon={<CheckCircle className="size-5 md:size-6" />} color="rendah"
              onClick={() => handleRiskCardClick('rendah')}
              active={activeRisk === 'rendah'}
            />
          </section>

          <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-5">
              <Section title="Distribusi Tingkat Risiko" desc="Proporsi tingkat risiko karyawan di seluruh perusahaan.">
                <RiskPieChart data={dist} />
              </Section>
            </div>

            <div className="xl:col-span-7">
              <Section
                title="Faktor Pendorong Risiko Utama"
                desc="Atribut kinerja yang paling dominan memicu terdeteksinya anomali."
                action={
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-inter">Top</span>
                    {[5, 10, 15, 20].map((n) => (
                      <button
                        key={n}
                        onClick={() => setTopN(n)}
                        className={`h-7 min-w-[32px] rounded-md px-2 text-xs font-medium transition ${
                          topN === n
                            ? 'bg-brand-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10'
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

          <div className="mb-8">
            <Section title="Sebaran Skor Risiko" desc="Klik pada batang grafik untuk menyaring karyawan di tabel berdasarkan rentang skor tertentu.">
              <ScoreHistogram scores={allScores} p90={p90} p95={p95} onBarClick={handleHistogramBarClick} selectedRange={scoreRange} />
            </Section>
          </div>

          <div className="mb-4">
            <Section
              title="Daftar Evaluasi Karyawan"
              desc={
                activeRisk
                  ? `Filter aktif: Risiko ${activeRisk}. Klik kartu metrik di atas untuk membatalkan.`
                  : scoreRange
                  ? `Filter aktif: Skor terpilih. Klik grafik di atas untuk membatalkan.`
                  : 'Klik baris mana saja untuk melihat analisis detail individu.'
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
        </div>
      )}

      {/* RISIKO PAGE */}
      {currentHash === '#risiko' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Section title="Distribusi Tingkat Risiko" desc="Proporsi tingkat risiko karyawan di seluruh perusahaan.">
            <div className="max-w-3xl mx-auto py-8">
              <RiskPieChart data={dist} />
            </div>
          </Section>
        </div>
      )}

      {/* SHAP PAGE */}
      {currentHash === '#shap' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Section
            title="Faktor Pendorong Risiko Utama"
            desc="Atribut kinerja yang paling dominan memicu terdeteksinya anomali."
            action={
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-inter">Top</span>
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setTopN(n)}
                    className={`h-7 min-w-[32px] rounded-md px-2 text-xs font-medium transition ${
                      topN === n
                        ? 'bg-brand-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            }
          >
            <div className="max-w-5xl mx-auto py-4">
              <ShapBarChart data={shap} />
            </div>
          </Section>
        </div>
      )}

      {/* HISTOGRAM PAGE */}
      {currentHash === '#histogram' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Section
            title="Sebaran Skor Risiko"
            desc="Klik pada batang grafik untuk menyaring karyawan di tabel berdasarkan rentang skor tertentu."
          >
            <div className="max-w-5xl mx-auto py-4">
              <ScoreHistogram
                scores={allScores}
                p90={p90}
                p95={p95}
                onBarClick={handleHistogramBarClick}
                selectedRange={scoreRange}
              />
            </div>
          </Section>
        </div>
      )}

      {/* KARYAWAN PAGE — Data Mentah */}
      {currentHash === '#karyawan' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Section
            title="Data Karyawan"
            desc="Data mentah seluruh karyawan sebelum diproses oleh model ML. Tidak mengandung kolom skor anomali atau kategori risiko."
          >
            <EmployeeRawTable />
          </Section>
        </div>
      )}

      {/* TABEL PAGE — Hasil Analisis Anomali */}
      {currentHash === '#tabel' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Section
            title="Daftar Evaluasi Karyawan"
            desc={
              activeRisk
                ? `Filter aktif: Risiko ${activeRisk}. Buka Overview untuk membatalkan.`
                : scoreRange
                ? `Filter aktif: Skor terpilih. Buka Histogram untuk membatalkan.`
                : 'Klik baris mana saja untuk melihat analisis detail individu.'
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
      )}

      {/* TAMBAH KARYAWAN PAGE */}
      {currentHash === '#tambah' && (
        <AddEmployeePage
          onSuccess={() => {
            setTableKey((k) => k + 1); // refresh table
            getSummary().then(setSummary).catch(() => {}); // refresh stats
          }}
        />
      )}

      {/* Local SHAP modal */}
      {selectedEmp && (
        <ShapLocalPanel employee={selectedEmp} onClose={() => setSelectedEmp(null)} />
      )}

      {/* Disclaimer */}
      {(currentHash === '#overview' || currentHash === '') && (
        <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50/50 px-5 py-4 text-sm text-blue-800 font-inter flex gap-3 items-start dark:border-blue-900/30 dark:bg-blue-900/10 dark:text-blue-200 animate-in fade-in slide-in-from-bottom-4">
          <div className="mt-0.5 text-blue-500">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold block mb-1">Catatan Penggunaan</span>
            Sistem deteksi ini dirancang sebagai asisten pemantauan awal. Keputusan tindak lanjut tetap sepenuhnya berada di tangan dan kebijaksanaan tim HR berdasarkan evaluasi menyeluruh.
          </div>
        </div>
      )}
    </AppLayout>
  );
}
