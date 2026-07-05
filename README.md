# Dashboard Monitoring HR: Deteksi Anomali Kinerja Karyawan

Repositori ini berisi kode sumber untuk tugas akhir/skripsi dengan judul **"Deteksi Anomali Profil Kinerja Karyawan Menggunakan Isolation Forest dengan Interpretasi XGBoost-SHAP pada Dashboard Monitoring HR"**.

Aplikasi ini dirancang khusus untuk membantu praktisi Human Resources (HR) dalam mengidentifikasi profil karyawan yang tidak wajar (anomali) secara otomatis, lalu memberikan interpretasi penyebab keanehan tersebut menggunakan algoritma *Explainable AI* (SHAP).

---

## 🏛️ Arsitektur Sistem

Sistem ini dibangun menggunakan arsitektur *microservices-based* (3-Tier) untuk memisahkan beban kerja komputasi *machine learning* dengan logika bisnis operasional:

1. **Frontend (Client-Side)**: Dibangun dengan **React (TypeScript)** dan **Tailwind CSS**. Bertugas sebagai *Dashboard UI* yang responsif dan interaktif untuk visualisasi grafik analitik, *waterfall chart*, dan manajemen data karyawan.
2. **Backend (Server-Side)**: Dibangun dengan **NestJS (Node.js)**. Bertugas sebagai jembatan API (*API Gateway*), manajemen *database*, serta menangani logika *filtering* dan pencarian data karyawan.
3. **ML Engine (Model-Side)**: Dibangun dengan **Flask (Python)**. Berperan sebagai *engine* khusus yang memuat model *Isolation Forest* dan eksplanator *TreeSHAP*. Engine ini menerima data karyawan, memproses skor anomali, dan mengembalikan vektor dampak atribut secara *real-time*.

---

## 🚀 Fitur Utama

- **Overview & Risk Distribution**: Ringkasan persentase karyawan berisiko tinggi beserta *boxplot* distribusi.
- **Advanced Analytics**: Visualisasi mendalam (seperti *Scatter Plot* Stagnasi Karir dan Kestabilan Model MCCV) untuk evaluasi performa algoritma.
- **Form Prediksi Real-Time**: Antarmuka untuk memasukkan data karyawan tunggal baru dan mendapatkan prediksi skor anomali secara instan dari *ML Engine*.
- **Tabel Hasil Deteksi Anomali**: Tabel interaktif dengan dukungan penyaringan (*filtering*) dan pengurutan (*sorting*) berdasarkan tingkat anomali.
- **Global SHAP Explanation**: Menampilkan kontribusi tiap atribut/fitur secara agregat (keseluruhan dataset) dalam menentukan skor anomali.
- **Local SHAP & Konteks Komparatif**: Menyajikan *Waterfall Chart* untuk setiap individu guna menjelaskan "mengapa" ia dianggap anomali, dilengkapi dengan Panel Konteks spesifik (Komparasi Pendapatan, Kesejahteraan, dan Karir) dengan metrik rata-rata perusahaan.

---

## 📂 Struktur Repositori

```text
hr-anomaly-dashboard/
│
├── frontend/                 # React UI, Visualisasi Recharts, Komponen Antarmuka
│   ├── src/components/       # Komponen visual (SHAP Local Panel, Charts)
│   ├── src/pages/            # Halaman Dashboard Utama
│   └── package.json          # Dependensi Frontend
│
├── backend/                  # NestJS API Gateway & Business Logic
│   ├── src/employees/        # Endpoint data karyawan dan jembatan ke ML Flask
│   └── package.json          # Dependensi Backend Node.js
│
├── model/                    # Flask ML Engine & Script Pelatihan Model
│   ├── development_ml.py     # Script latih Isolation Forest & Surrogate XGBoost
│   ├── generate_figures.py   # Script otomatisasi visualisasi evaluasi model
│   ├── app.py                # Flask Server untuk inferensi ML (API)
│   └── requirements.txt      # Dependensi Python (scikit-learn, shap, flask, xgboost)
│
└── dataset/                  # Dataset HR Analytics asli
```

---

## 💻 Cara Menjalankan Aplikasi Secara Lokal

### 1. Menjalankan ML Engine (Flask)
```bash
cd model
pip install -r requirements.txt
python app.py
# Server berjalan di http://localhost:5000
```

### 2. Menjalankan Backend API (NestJS)
```bash
cd backend
npm install
npm run start:dev
# API Server berjalan di http://localhost:3000
```

### 3. Menjalankan Frontend Dashboard (React)
```bash
cd frontend
npm install
npm run dev
# Dashboard dapat diakses di http://localhost:5173
```

---

## 🔬 Algoritma & Model Machine Learning
* **Isolation Forest**: Digunakan sebagai model primer tanpa pengawasan (*unsupervised*) untuk memisahkan inliers (normal) dan outliers (anomali) tanpa bergantung pada label.
* **XGBoost (Surrogate Model)**: Model sekunder yang dilatih ulang menggunakan *pseudo-labels* dari Isolation Forest agar data dapat diinterpretasikan.
* **TreeSHAP (SHapley Additive exPlanations)**: Metode pendekatan *Game Theory* untuk membedah prediksi XGBoost sehingga setiap prediksi tingkat individu memiliki skor transparansi untuk setiap atributnya.

---
*Dikembangkan oleh Aldini Hege Pratama untuk keperluan Tugas Akhir.*
