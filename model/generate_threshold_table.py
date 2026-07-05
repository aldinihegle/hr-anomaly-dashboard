import pandas as pd
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).parent
OUTPUTS_DIR = BASE_DIR / "outputs"
INPUT_CSV = OUTPUTS_DIR / "anomaly_scoring_results.csv"
OUTPUT_CSV = OUTPUTS_DIR / "tabel_analisis_sensitivitas.csv"

def main():
    if not INPUT_CSV.exists():
        print(f"File {INPUT_CSV} tidak ditemukan!")
        return

    df = pd.read_csv(INPUT_CSV)
    scores = df["anomaly_score_if"].values
    total = len(scores)

    results = []
    
    scenarios = [
        (85, "Simulasi Inklusif (P85)", "Terlalu longgar; beban review HR membengkak tajam karena terlalu banyak karyawan batas-normal ikut tersaring."),
        (90, "Pilihan Sistem (P90)", "Optimal; memotong 90% beban kerja HRD dan mengunci zona transisi secara proporsional sebagai peringatan dini."),
        (95, "Pilihan Sistem (P95)", "Sangat Ketat; mengisolasi inti (core) anomali sebagai prioritas investigasi utama yang mendesak."),
        (99, "Simulasi Eksklusif (P99)", "Terlalu sempit; berisiko kehilangan profil-profil anomali laten lainnya yang berpotensi menjadi flight risk jika tidak dievaluasi.")
    ]

    for p, name, desc in scenarios:
        cut = np.percentile(scores, p)
        n = (scores >= cut).sum()
        prop = (n / total) * 100
        
        results.append({
            "Skenario Persentil": name,
            "Nilai Batas (Threshold)": round(cut, 4),
            "Jumlah Karyawan Terfilter": n,
            "Proporsi (%)": f"{prop:.2f}%",
            "Karakteristik Dampak Bagi Tim HR": desc
        })

    df_results = pd.DataFrame(results)
    
    # Save as CSV with semicolon separator (good for Indonesian Excel)
    df_results.to_csv(OUTPUT_CSV, index=False, sep=";")
    
    print(f"Tabel Analisis Sensitivitas berhasil digenerate!\nLokasi: {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
