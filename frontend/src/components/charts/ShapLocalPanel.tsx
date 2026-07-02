import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { getShapLocal } from '../../api';
import type { EmployeeAnomaly, ShapLocalEntry } from '../../types';
import RiskBadge from '../ui/RiskBadge';
import { Lightbulb, ChevronRight } from 'lucide-react';

interface Props {
  employee: EmployeeAnomaly;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// KONTEKS MODEL:
//  • Isolation Forest (IF) mengukur path length untuk mengisolasi titik data.
//    Titik yang mudah diisolasi (path pendek) = berada di ruang fitur yang JARANG
//    = skor anomali TINGGI.
//  • XGBoost Surrogate mengaproksimasi skor IF sehingga bisa dihitung SHAP.
//  • SHAP positif → fitur ini MENAIKKAN skor anomali (mendorong profil ke arah langka).
//  • SHAP negatif → fitur ini MENEKAN skor anomali (menarik profil ke arah umum).
//  • Yang terdeteksi bukan nilai tunggal yang buruk, melainkan KOMBINASI nilai
//    yang langka secara statistik dibandingkan 1.470 profil di dataset.
// ─────────────────────────────────────────────────────────────────────────────



// ─────────────────────────────────────────────────────────────────────────────
// Fungsi utama: menghasilkan label + penjelasan kontekstual berbasis:
//   1. Nama fitur (dari output OHE model)
//   2. Nilai SHAP (positif = menaikkan, negatif = menekan)
//   3. Data nyata karyawan (untuk memberi konteks nilai aktual)
// ─────────────────────────────────────────────────────────────────────────────
function getFeatureInfo(
  feature: string,
  shapValue: number,
  emp: EmployeeAnomaly,
): { label: string; reason: string } {
  const up = shapValue >= 0;

  // ── Helper nilai yang ditampilkan ──────────────────────────────────────
  const inc   = `$${emp.monthlyIncome?.toLocaleString()}`;
  const role  = emp.jobRole ?? 'jabatan ini';
  const dept  = emp.department ?? 'departemennya';
  const lvl   = emp.jobLevel ?? '–';
  const ot    = emp.overTime === 'Yes';
  const yac   = emp.yearsAtCompany;
  const twy   = emp.totalWorkingYears;
  const yicr  = emp.yearsInCurrentRole;
  const yslp  = emp.yearsSinceLastPromotion;
  const ywcm  = emp.yearsWithCurrManager;
  const dfh   = emp.distanceFromHome;
  const nc    = emp.numCompaniesWorked;
  const psh   = emp.percentSalaryHike;
  const sol   = emp.stockOptionLevel;
  const ttly  = emp.trainingTimesLastYear;
  const wlb   = emp.workLifeBalance;
  const ji    = emp.jobInvolvement;
  const js    = emp.jobSatisfaction;
  const es    = emp.environmentSatisfaction;
  const rs    = emp.relationshipSatisfaction;
  const pr    = emp.performanceRating;
  const edu   = emp.education;

  // ── Fitur-fitur numerik utama ──────────────────────────────────────────

  if (feature === 'MonthlyIncome') {
    return {
      label: 'Pendapatan Bulanan',
      reason: up
        ? `Gaji ${inc} untuk ${role} level ${lvl} dengan ${twy} tahun pengalaman adalah kombinasi yang menjadi perhatian khusus bagi sistem HR. Sistem mendeteksi pola kompensasi ini jarang ditemui pada profil karir serupa.`
        : `Gaji ${inc} selaras dengan struktur kompensasi standar untuk ${role} dengan pengalaman ${twy} tahun, yang berarti faktor ini berada pada batas wajar.`,
    };
  }

  if (feature === 'Age') {
    const age = emp.age;
    return {
      label: 'Usia',
      reason: up
        ? `Usia ${age} tahun dikombinasikan dengan level jabatan ${lvl} dan ${twy} tahun pengalaman tercatat sebagai pola yang tidak umum. Karyawan dengan karakteristik demografi dan profil karir ini merupakan kasus khusus.`
        : `Usia ${age} tahun konsisten dengan rata-rata karyawan untuk posisi ${role} sehingga tidak tercatat sebagai anomali.`,
    };
  }

  if (feature === 'TotalWorkingYears') {
    return {
      label: 'Total Pengalaman Kerja',
      reason: up
        ? `${twy} tahun total pengalaman kerja dikombinasikan dengan level jabatan ${lvl} dan pendapatan ${inc} membentuk profil karir yang unik. Sistem menandainya sebagai salah satu pemicu utama peringatan anomali.`
        : `${twy} tahun pengalaman kerja sesuai dengan level jabatan dan kompensasi saat ini.`,
    };
  }

  if (feature === 'YearsAtCompany') {
    return {
      label: 'Masa Kerja di Perusahaan',
      reason: up
        ? `${yac} tahun masa kerja di perusahaan tidak biasa jika dibandingkan dengan ${twy} tahun total pengalaman dan jabatan ${role}. Proporsi ini tercatat sebagai kondisi khusus oleh sistem.`
        : `${yac} tahun masa kerja di perusahaan ini proporsional dengan total perjalanan karirnya.`,
    };
  }

  if (feature === 'YearsInCurrentRole') {
    return {
      label: 'Lama di Jabatan Saat Ini',
      reason: up
        ? `${yicr} tahun di posisi saat ini, bersama dengan ${yslp} tahun sejak promosi terakhir dan masa kerja ${yac} tahun, menunjukkan indikasi pola penugasan yang jarang terjadi.`
        : `${yicr} tahun di jabatan ini termasuk durasi yang wajar untuk masa kerja ${yac} tahun.`,
    };
  }

  if (feature === 'YearsSinceLastPromotion') {
    return {
      label: 'Waktu Sejak Promosi Terakhir',
      reason: up
        ? `${yslp} tahun sejak promosi terakhir, dikombinasikan dengan masa kerja ${yac} tahun pada jabatan level ${lvl}, membentuk pola stagnasi karir yang memerlukan peninjauan HR.`
        : `${yslp} tahun sejak promosi terakhir tergolong normal dan sejalan dengan rata-rata perkembangan karir.`,
    };
  }

  if (feature === 'YearsWithCurrManager') {
    return {
      label: 'Lama dengan Manajer Saat Ini',
      reason: up
        ? `${ywcm} tahun berada di bawah supervisi manajer saat ini, terutama dengan masa kerja ${yac} tahun, memunculkan pola interaksi manajerial yang butuh perhatian.`
        : `${ywcm} tahun bekerja dengan manajer yang sama adalah situasi umum untuk masa kerja saat ini.`,
    };
  }

  if (feature === 'DistanceFromHome') {
    return {
      label: 'Jarak Rumah ke Kantor',
      reason: up
        ? `Jarak ${dfh} km dari rumah ke kantor, ditambah dengan jadwal ${ot ? 'lembur' : 'kerja reguler'}, menjadi indikator potensi beban mobilitas yang tidak umum.`
        : `Jarak tempuh ${dfh} km ke kantor tergolong wajar dan tidak memicu sinyal tekanan jarak.`,
    };
  }

  if (feature === 'PercentSalaryHike') {
    return {
      label: 'Kenaikan Gaji (%)',
      reason: up
        ? `Kenaikan gaji sebesar ${psh}% menunjukkan ketidaksesuaian historis dengan performa kerja level ${pr} atau masa kerja ${yac} tahun, sehingga sistem mendeteksinya sebagai kasus yang butuh peninjauan.`
        : `Kenaikan gaji ${psh}% sesuai dengan rentang standar penilaian kinerja dan pengabdiannya.`,
    };
  }

  if (feature === 'NumCompaniesWorked') {
    return {
      label: 'Jumlah Perusahaan Sebelumnya',
      reason: up
        ? `Riwayat bekerja di ${nc} perusahaan sebelumnya, digabungkan dengan usia ${emp.age} tahun, menyoroti rekam jejak turnover yang tidak biasa bagi profil serupa.`
        : `Bekerja di ${nc} perusahaan sebelumnya dinilai sebagai riwayat karir yang lumrah untuk tingkat usianya.`,
    };
  }

  if (feature === 'JobLevel') {
    return {
      label: 'Level Jabatan',
      reason: up
        ? `Posisi level ${lvl} tampak kurang berimbang apabila disejajarkan dengan kompensasi ${inc} dan pengalaman ${twy} tahun. Hal ini menjadi faktor peringatan struktural.`
        : `Tingkatan level ${lvl} ini masuk akal dan proporsional dengan gaji bulanan yang diberikan.`,
    };
  }

  if (feature === 'StockOptionLevel') {
    return {
      label: 'Level Opsi Saham',
      reason: up
        ? `Partisipasi opsi saham di tingkat ${sol}, dibandingkan posisi level ${lvl} serta gaji ${inc}, adalah kombinasi paket kompensasi tambahan yang jarang dijumpai.`
        : `Tingkat partisipasi opsi saham terpantau sesuai dengan skema rata-rata posisi ini.`,
    };
  }

  if (feature === 'TrainingTimesLastYear') {
    return {
      label: 'Frekuensi Pelatihan (Tahun Lalu)',
      reason: up
        ? `Mengikuti pelatihan sebanyak ${ttly} kali tahun lalu menampilkan pola investasi SDM yang berbeda dari rekan kerja lain di tingkatan yang sama.`
        : `Tingkat keikutsertaan pelatihan dinilai cukup normal bagi pengembangan kompetensinya.`,
    };
  }

  if (feature === 'WorkLifeBalance') {
    const lblWlb = ['', 'Buruk', 'Baik', 'Lebih Baik', 'Terbaik'][wlb] ?? wlb;
    return {
      label: 'Keseimbangan Kerja-Kehidupan',
      reason: up
        ? `Status Work-Life Balance di tingkat "${lblWlb}", yang dikombinasikan dengan dinamika jadwal kerjanya, memberikan sinyal tekanan keseimbangan hidup yang spesifik.`
        : `Persepsi Work-Life Balance dilaporkan pada batasan yang baik dan tidak menjadi faktor risiko.`,
    };
  }

  if (feature === 'JobInvolvement') {
    const lblJi = ['', 'Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi'][ji] ?? ji;
    return {
      label: 'Keterlibatan Kerja',
      reason: up
        ? `Tingkat keterlibatan "${lblJi}" ini tidak sesuai dengan kecenderungan partisipasi pada departemen ${dept}, mengindikasikan perlunya pendekatan manajemen khusus.`
        : `Tingkat partisipasi dan keterlibatan kerja sejajar dengan nilai standar pada organisasinya.`,
    };
  }

  if (feature === 'JobSatisfaction') {
    const lblJs = ['', 'Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi'][js] ?? js;
    return {
      label: 'Kepuasan Kerja',
      reason: up
        ? `Laporan kepuasan kerja di ambang "${lblJs}", apabila dikaitkan dengan faktor durasi peran dan karir saat ini, mencerminkan adanya ketidaksesuaian pengalaman pekerja.`
        : `Indeks kepuasan kerja terekam positif, berada di koridor ekspektasi umum.`,
    };
  }

  if (feature === 'EnvironmentSatisfaction') {
    const lblEs = ['', 'Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi'][es] ?? es;
    return {
      label: 'Kepuasan Lingkungan Kerja',
      reason: up
        ? `Kepuasan lingkungan bernilai "${lblEs}", jika dianalisa menyeluruh dengan faktor kenyamanan lainnya, mengindikasikan pandangan iklim kerja yang tidak merata.`
        : `Survei kepuasan lingkungan kerja dinilai stabil dan dalam rentang ideal.`,
    };
  }

  if (feature === 'RelationshipSatisfaction') {
    const lblRs = ['', 'Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi'][rs] ?? rs;
    return {
      label: 'Kepuasan Hubungan Kerja',
      reason: up
        ? `Tingkat kepuasan interaksi di level "${lblRs}" memberikan sinyal potensi isu hubungan dengan manajer atau rekan sejawat.`
        : `Interaksi dan hubungan kerja dilaporkan harmonis oleh sistem penilaian terkait.`,
    };
  }

  if (feature === 'PerformanceRating') {
    const lblPr = ['', 'Rendah', 'Baik', 'Sangat Baik', 'Luar Biasa'][pr] ?? pr;
    return {
      label: 'Penilaian Kinerja',
      reason: up
        ? `Penilaian kinerja berskala "${lblPr}" menjadi anomali ketika dihubungkan ke kenaikan gaji ${psh}% — menyoroti ketimpangan evaluasi hasil kerja.`
        : `Evaluasi kinerja sepadan dengan struktur promosi dan insentif terkait.`,
    };
  }

  if (feature === 'Education') {
    const lblEdu = ['', 'Di Bawah PT', 'Perguruan Tinggi', 'Sarjana', 'Magister', 'Doktor'][edu] ?? edu;
    return {
      label: 'Tingkat Pendidikan',
      reason: up
        ? `Pencapaian akademis "${lblEdu}" untuk tingkat posisi ${role} menampilkan latar belakang kompetensi yang berbeda dari kebanyakan individu di posisi yang sama.`
        : `Jenjang pendidikan selaras dengan tuntutan spesifikasi pada perannya.`,
    };
  }

  if (feature === 'HourlyRate') {
    const hr = emp.hourlyRate;
    return {
      label: 'Tarif Per Jam',
      reason: up
        ? `Rasio tarif upah per jam sebesar $${hr} menimbulkan asimetri bila dibandingkan skala gaji bulanan pokok pada level jabatannya.`
        : `Penetapan upah per jam tidak memicu peringatan ketidaksesuaian struktur gajinya.`,
    };
  }

  if (feature === 'DailyRate') {
    const dr = emp.dailyRate;
    return {
      label: 'Tarif Per Hari',
      reason: up
        ? `Kalkulasi tarif per hari sebesar $${dr} memicu perhatian atas landasan komponen pendapatan bulanannya.`
        : `Distribusi upah harian ini tercatat logis dalam proporsi skala gajinya.`,
    };
  }

  if (feature === 'MonthlyRate') {
    const mr = emp.monthlyRate;
    return {
      label: 'Tarif Bulanan',
      reason: up
        ? `Indeks beban upah bulanan sebesar $${mr?.toLocaleString()} mengisyaratkan penyimpangan terhadap struktur total reward ekspektasi jabatannya.`
        : `Hitungan kompensasi ini berjalan lurus dan relevan tanpa menyebabkan peringatan dari sistem.`,
    };
  }

  // ── Fitur kategorikal (hasil OHE) ──────────────────────────────────────

  if (feature === 'OverTime_Yes') {
    return {
      label: 'Lembur',
      reason: up
        ? `Status pekerja sering melakukan kerja lembur menjadi catatan khusus, apalagi dikombinasikan dengan indikator jarak tempuh atau metrik kepuasannya.`
        : `Pola kepatuhan waktu kerjanya seimbang, tidak terdeteksi adanya eksploitasi durasi kerja.`,
    };
  }

  if (feature.startsWith('Department_')) {
    const deptName = feature.replace('Department_', '');
    return {
      label: `Departemen: ${deptName}`,
      reason: up
        ? `Kondisi karyawan ini jarang terjadi dibandingkan rata-rata karyawan di divisi ${deptName}, memicu peringatan sistem spesifik untuk area ini.`
        : `Penempatan kerja dinilai selaras dan mencerminkan keadaan reguler departemen tersebut.`,
    };
  }

  if (feature.startsWith('BusinessTravel_')) {
    const travelMap: Record<string, string> = {
      'BusinessTravel_Travel_Frequently': 'Sering melakukan perjalanan dinas',
      'BusinessTravel_Travel_Rarely': 'Jarang melakukan perjalanan dinas',
    };
    const travelLabel = travelMap[feature] ?? feature.replace('BusinessTravel_', '');
    return {
      label: 'Pola Perjalanan Dinas',
      reason: up
        ? `Intensitas "${travelLabel}" menjadi indikator kelelahan, utamanya bila disandingkan dengan durasi waktu kerja dan tingkat beban posisi.`
        : `Jadwal dan rutinitas penugasan dinilai masuk dalam ambang penerimaan beban normal.`,
    };
  }

  if (feature.startsWith('MaritalStatus_')) {
    const status = feature.replace('MaritalStatus_', '');
    const lblStatus: Record<string, string> = { Single: 'Lajang', Married: 'Menikah' };
    return {
      label: `Status Pernikahan: ${lblStatus[status] ?? status}`,
      reason: up
        ? `Faktor status keluarga dikombinasikan metrik perjalanan harian ke kantor menjadi perhatian profil khusus dari sisi tunjangan dan mobilitasnya.`
        : `Profil status sosial tidak mempengaruhi keseimbangan karir dan kinerjanya.`,
    };
  }

  if (feature === 'Gender_Male') {
    return {
      label: 'Gender',
      reason: up
        ? `Struktur rasio pendapatan dan peran struktural individu ini menampilkan distribusi nilai yang tidak umum berdasarkan pengamatan keragaman organisasi.`
        : `Parameter representasi tidak menyebabkan indikasi ketimpangan terkait peran tersebut.`,
    };
  }

  if (feature.startsWith('JobRole_')) {
    const roleName = feature.replace('JobRole_', '');
    return {
      label: `Jabatan: ${roleName}`,
      reason: up
        ? `Secara operasional, keseharian peran di jabatan ${roleName} ini sangat tidak biasa dibanding teman seprofesinya, mendorong evaluasi peran spesifik.`
        : `Struktur fungsional posisinya terpantau berjalan sebagaimana ekspektasi umum.`,
    };
  }

  if (feature.startsWith('EducationField_')) {
    const fieldName = feature.replace('EducationField_', '');
    return {
      label: `Bidang Studi: ${fieldName}`,
      reason: up
        ? `Perpaduan latar pendidikan ${fieldName} dan penguasaan jabatan ${role} menyajikan indikasi transisi kompetensi yang perlu diamati sistem HR.`
        : `Pemanfaatan kompetensi jalur akademis di peran kerjanya terverifikasi logis.`,
    };
  }

  // ── Fallback ──────────────────────────────────────────────────────────
  return {
    label: feature.replace(/_/g, ' '),
    reason: up
      ? `Nilai faktor ini terindikasi membentuk struktur profil yang memicu peringatan khusus dari sistem analisis HR.`
      : `Nilai observasi fitur ini beroperasi pada batasan lazim organisasi.`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Narasi ringkas status risiko
// ─────────────────────────────────────────────────────────────────────────────
const RISK_NARASI: Record<'rendah' | 'sedang' | 'tinggi', string> = {
  rendah:
    'Profil demografi dan karir karyawan ini tergolong normal dan sering ditemui di lingkungan kerja organisasi. Tidak ada anomali struktural atau ketidakselarasan kinerja yang dominan.',
  sedang:
    'Sistem mendeteksi beberapa kondisi yang tidak biasa pada profil karyawan ini dibandingkan kelompok sejawatnya, sehingga patut mendapatkan perhatian lebih awal oleh divisi HR.',
  tinggi:
    'Berdasarkan seluruh atribut yang ada, karyawan ini mempunyai situasi dan profil yang paling jarang ditemui. Kondisi struktural ini menjadi prioritas tinggi untuk ditinjau oleh HR.',
};

// ─────────────────────────────────────────────────────────────────────────────
// Generator rekomendasi tindakan HR
// ─────────────────────────────────────────────────────────────────────────────
function generateConclusion(emp: EmployeeAnomaly, factors: ShapLocalEntry[]): string[] {
  const risk = emp.riskCategory;
  const actions: string[] = [];

  const posFactors = factors.filter((f) => f.shapValue > 0).map((f) => f.feature);
  const hasOvertime       = posFactors.some((f) => f.includes('OverTime'));
  const hasLowSatisf      = posFactors.some((f) => ['JobSatisfaction', 'EnvironmentSatisfaction', 'RelationshipSatisfaction', 'WorkLifeBalance'].includes(f));
  const hasIncomeAnomaly  = posFactors.includes('MonthlyIncome');
  const hasStagnantCareer = posFactors.some((f) => ['YearsSinceLastPromotion', 'YearsInCurrentRole'].includes(f));
  const hasSeniorProfile  = posFactors.some((f) => ['TotalWorkingYears', 'YearsAtCompany', 'Age'].includes(f));

  if (risk === 'rendah') {
    actions.push('Tidak ada tindakan mendesak. Pantau sebagai bagian dari evaluasi rutin.');
    if (factors.filter((f) => f.shapValue < 0).length > factors.filter((f) => f.shapValue > 0).length) {
      actions.push('Beberapa faktor justru menekan risiko, pertahankan kondisi positif ini sebagai referensi praktik terbaik.');
    }
  } else if (risk === 'sedang') {
    actions.push('Disarankan percakapan 1-on-1 untuk memahami kondisi kerja karyawan ini.');
    if (hasOvertime) actions.push('Tinjau beban kerja, lembur berulang adalah sinyal awal kelelahan kerja.');
    if (hasLowSatisf) actions.push('Lakukan asesmen kepuasan atau diskusi informal untuk mengidentifikasi hambatan kerja.');
    if (hasStagnantCareer) actions.push('Evaluasi progres karir, lama tanpa promosi berisiko menurunkan motivasi jangka panjang.');
  } else {
    actions.push('Jadikan peninjauan profil ini prioritas di siklus evaluasi HR berikutnya.');
    if (hasOvertime && hasLowSatisf) {
      actions.push('Kombinasi lembur tinggi dan kepuasan rendah memiliki risiko retensi tinggi. Segera evaluasi distribusi beban kerja dan pertimbangkan intervensi manajerial.');
    } else {
      if (hasOvertime)  actions.push('Tinjau kebijakan lembur dan pertimbangkan penyesuaian beban atau rotasi tugas.');
      if (hasLowSatisf) actions.push('Kepuasan rendah di beberapa dimensi memerlukan perhatian segera. Jadwalkan sesi asesmen menyeluruh.');
    }
    if (hasIncomeAnomaly) actions.push('Periksa keselarasan kompensasi dengan jabatan, level, dan kontribusi aktual karyawan.');
    if (hasStagnantCareer) actions.push('Diskusikan roadmap karir secara konkret. Stagnasi panjang pada karyawan risiko tinggi sering mendahului keputusan resign.');
    if (hasSeniorProfile) actions.push('Karyawan berpengalaman yang muncul sebagai anomali berpotensi mengalami disengagement. Pertimbangkan program retensi atau eksplorasi peran baru.');
    actions.push('Dokumentasikan temuan dan tetapkan tindak lanjut terukur dalam 30 hari ke depan.');
  }
  return actions;
}

// ─────────────────────────────────────────────────────────────────────────────
// Komponen utama
// ─────────────────────────────────────────────────────────────────────────────
export default function ShapLocalPanel({ employee, onClose }: Props) {
  const [data, setData] = useState<ShapLocalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTechnical, setShowTechnical] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getShapLocal(employee.id, 12)
      .then((rows) => setData([...rows].sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [employee.id]);

  useEffect(() => { load(); }, [load]);

  const risk = employee.riskCategory as 'rendah' | 'sedang' | 'tinggi';
  const top5 = data.slice(0, 5);
  const conclusions = generateConclusion(employee, data);

  const riskBorderCls =
    risk === 'tinggi' ? 'border-error-200 bg-error-50 dark:border-error-500/30 dark:bg-error-500/10'
    : risk === 'sedang' ? 'border-warning-200 bg-warning-50 dark:border-warning-500/30 dark:bg-warning-500/10'
    : 'border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10';
  const riskTextCls =
    risk === 'tinggi' ? 'text-error-600 dark:text-error-400'
    : risk === 'sedang' ? 'text-warning-600 dark:text-warning-400'
    : 'text-success-600 dark:text-success-400';
  const riskDotCls =
    risk === 'tinggi' ? 'text-error-500' : risk === 'sedang' ? 'text-warning-500' : 'text-success-500';

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-99999 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-300"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div>
            <h2 className="text-base font-bold text-gray-800 dark:text-white/90">
              Analisis Anomali Karyawan #{employee.id}
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">{employee.jobRole} · {employee.department}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-white"
            aria-label="Tutup"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">

          {/* Status risiko */}
          <div className={`rounded-xl border px-4 py-3 ${riskBorderCls}`}>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Status Profil Anomali
              </span>
              <RiskBadge category={risk} />
            </div>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{RISK_NARASI[risk]}</p>
          </div>

          {/* Ringkasan cepat */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Usia', value: `${employee.age} th` },
              { label: 'Gaji Bulanan', value: `$${employee.monthlyIncome?.toLocaleString()}`, mono: true },
              { label: 'Total Pengalaman', value: `${employee.totalWorkingYears} th` },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-white/[0.02]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{item.label}</div>
                <div className={`mt-1 text-sm font-semibold ${(item as any).mono ? 'font-mono' : ''} text-gray-800 dark:text-white`}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Faktor Penjelas */}
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400">Memuat faktor penjelas…</div>
          ) : data.length > 0 ? (
            <>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Analisis Akar Masalah (Root Cause)
                </h3>
                <p className="mb-3 text-xs leading-relaxed text-gray-400">
                  Grafik ini membantu HR mengetahui alasan spesifik mengapa karyawan ini terdeteksi tidak wajar. Fokuslah pada faktor di urutan teratas (misal: lembur tinggi) saat sesi evaluasi atau coaching.&nbsp;
                  <span className="font-medium text-error-500">Merah ↑</span> = Memicu Risiko ·&nbsp;
                  <span className="font-medium text-brand-500">Biru ↓</span> = Meredam Risiko.
                </p>

                {/* Top 5 dengan reasoning kontekstual */}
                <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                  {top5.map((d, i) => {
                    const info = getFeatureInfo(d.feature, d.shapValue, employee);
                    const isUp = d.shapValue >= 0;
                    return (
                      <div
                        key={i}
                        className={`px-4 py-4 ${i < top5.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${isUp ? 'bg-error-500' : 'bg-brand-500'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{info.label}</span>
                              <span className={`shrink-0 text-xs font-bold ${isUp ? 'text-error-500' : 'text-brand-500'}`}>
                                {isUp ? '↑ Meningkatkan Risiko' : '↓ Menurunkan Risiko'}
                              </span>
                            </div>
                            <p className="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                              {info.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bar chart semua fitur */}
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Kontribusi Seluruh Faktor (Top 12)
                </h4>
                <ResponsiveContainer width="100%" height={Math.max(260, data.length * 28)}>
                  <BarChart
                    layout="vertical"
                    data={data.map((d) => ({ ...d, label: getFeatureInfo(d.feature, d.shapValue, employee).label }))}
                    margin={{ left: 4, right: 30, top: 4, bottom: 4 }}
                  >
                    <XAxis type="number" tick={{ fontSize: 10 }} axisLine={{ stroke: 'currentColor', strokeOpacity: 0.15 }} tickLine={false} tickFormatter={(v: number) => v.toFixed(3)} />
                    <YAxis type="category" dataKey="label" width={180} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(70,95,255,0.06)' }}
                      content={(props: { active?: boolean; payload?: readonly unknown[] }) => {
                        const { active, payload } = props;
                        if (!active || !payload?.length) return null;
                        const d = (payload[0] as { payload: ShapLocalEntry & { label: string } }).payload;
                        const info = getFeatureInfo(d.feature, d.shapValue, employee);
                        const isUp = d.shapValue >= 0;
                        return (
                          <div className="max-w-sm rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-theme-md dark:border-gray-700 dark:bg-gray-900">
                            <div className="mb-1 font-semibold text-gray-800 dark:text-white">{info.label}</div>
                            <div className="text-gray-500 leading-relaxed">{info.reason}</div>
                            {showTechnical && (
                              <div className={`mt-1 font-mono font-semibold ${isUp ? 'text-error-500' : 'text-brand-500'}`}>
                                SHAP: {d.shapValue.toFixed(5)}
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                    <ReferenceLine x={0} stroke="currentColor" strokeOpacity={0.2} />
                    <Bar dataKey="shapValue" radius={[0, 3, 3, 0]}>
                      {data.map((d, i) => <Cell key={i} fill={d.shapValue >= 0 ? '#f04438' : '#465fff'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Kesimpulan & Rekomendasi */}
              <div className={`rounded-xl border px-4 py-4 ${riskBorderCls}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className={`size-4 ${riskDotCls}`} strokeWidth={2.5} />
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${riskTextCls}`}>
                    Kesimpulan & Rekomendasi Tindakan HR
                  </h4>
                </div>
                <ul className="space-y-2.5">
                  {conclusions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <ChevronRight className={`mt-0.5 shrink-0 size-4 ${riskDotCls}`} />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-sm text-gray-400">Tidak ada data faktor penjelas</div>
          )}



          {/* Detail teknis */}
          <div>
            <button
              onClick={() => setShowTechnical((v) => !v)}
              className="text-xs text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline dark:hover:text-gray-200"
            >
              {showTechnical ? 'Sembunyikan' : 'Tampilkan'} detail teknis model
            </button>
            {showTechnical && (
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-white/[0.02]">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Anomaly Score (IF)</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold text-brand-600 dark:text-brand-400">{employee.anomalyScoreIf.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Kategori Risiko</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">{employee.riskCategory}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Metode</div>
                  <div className="mt-0.5 text-xs text-gray-500">Isolation Forest (n=200, max_samples=256) + XGBoost Surrogate (R²≈0.87) + TreeSHAP</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Threshold</div>
                  <div className="mt-0.5 text-xs text-gray-500">P90 = 0.5820 (sedang) · P95 = 0.6473 (tinggi)</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
