2. Warna (Color Palette)
Untuk dashboard monitoring, warna harus membantu menonjolkan data, bukan mendominasi layar.
Background (Latar Belakang): Gunakan warna abu-abu kebiruan yang sangat elegan dari Tailwind, yaitu Zinc atau Slate.
Light Mode: Background #F8FAFC (Slate 50), Card #FFFFFF.
Dark Mode (Sangat disarankan untuk monitoring 24/7): Background #09090B (Zinc 950), Card #18181B (Zinc 900).
Primary Accent (Warna Utama): Biru keunguan (Indigo atau Blue) atau Emerald (Hijau) jika monitoring Anda berfokus pada status "Aman/Normal".
Semantic Colors (Penting untuk peringatan di monitoring):
Success: Emerald-500 (Normal / Stabil)
Warning: Amber-500 (Perlu Perhatian / Anomali Sedang)
Danger/Error: Rose-500 atau Red-500 (Kritis / Anomali Tinggi)
3. Tipografi (Font)
Keterbacaan angka dan label data adalah segalanya di dashboard. Jangan gunakan lebih dari 2 jenis font.
Keluarga Font:
Header (H1 - H3): Plus Jakarta Sans atau Outfit. Karakter font ini modern, tegas, dan memberi kesan tech-savvy.
Body & Angka (Terkecil - Subheader): Inter atau Geist. Font ini didesain khusus untuk layar digital dan sangat mudah dibaca pada ukuran sekecil apapun (sangat penting untuk tabel data).
Hierarki Ukuran (Tailwind scale):
H1 (Judul Halaman Utama): text-3xl font-bold tracking-tight (Plus Jakarta Sans)
H2 (Judul Widget/Card): text-xl font-semibold (Plus Jakarta Sans)
Big Metric (Angka KPI besar): text-4xl font-extrabold (Inter)
Body (Tabel/Deskripsi): text-sm font-normal text-slate-600 (Inter)
Small Label (Tooltip/Note): text-xs font-medium text-slate-400 (Inter)
4. Paketan Ikon
Gunakan ikon yang memiliki ketebalan garis yang konsisten (consistent stroke weight).
Pilihan Utama: Lucide React
Alasan: Ini adalah standar emas saat ini. Sangat bersih, ringan, dan ketebalan garisnya bisa diatur. Merupakan "penerus" dari Feather Icons.
Alternatif: Phosphor Icons
Alasan: Pilihan variasi bentuknya (Regular, Bold, Fill, Duotone) sangat bagus jika Anda ingin membuat status ikon di dashboard (misal ikon menyala saat ada alert).
5. Animasi & Interaksi
Jangan buat dashboard yang terlalu banyak animasi karena akan terasa lambat dan mengganggu pembacaan data. Gunakan animasi hanya untuk transisi transaksional.
Framer Motion
Penggunaan: Sangat halus. Gunakan untuk transisi perpindahan antar halaman, animasi saat widget/card baru muncul (efek fade-in atau slide-up ringan), dan layout animation jika pengguna mengubah susunan grid pada dashboard.
Tailwind CSS Transitions
Penggunaan: Cukup gunakan fungsi bawaan Tailwind untuk interaksi mikro seperti hover pada tombol atau baris tabel (transition-colors duration-200).
6. Library Esensial Tambahan untuk Dashboard (Visualisasi Data)
Sebuah dashboard tidak lengkap tanpa grafik.
Recharts
Sangat solid dan terintegrasi baik dengan React. Mudah dikustomisasi dan animasinya bagus saat data masuk.
Nivo
Jika Anda membutuhkan grafik yang jauh lebih kompleks dan indah (seperti heatmap, radar, atau calendar charts) berbasis D3.js.
Sonner / React Hot Toast
Untuk menampilkan notifikasi/toast di pojok layar ketika ada alert atau peringatan baru yang terdeteksi di dashboard.