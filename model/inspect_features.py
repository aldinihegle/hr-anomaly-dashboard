import os
import joblib
import pandas as pd
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).parent
OUTPUTS_DIR = BASE_DIR / "outputs"

# Kolom yang dibuang sesuai development_ml.py
_BUANG = {"EmployeeCount", "Over18", "StandardHours", "EmployeeNumber",
          "Attrition", "anomaly_score_if", "risk_category"}

def main():
    print("Memuat artifacts dari:", OUTPUTS_DIR)
    
    try:
        encoder = joblib.load(OUTPUTS_DIR / "encoder.joblib")
    except Exception as e:
        print("Gagal memuat encoder:", e)
        return

    # Baca dataset referensi untuk mendapatkan daftar kolom
    df_ref = pd.read_csv(OUTPUTS_DIR / "anomaly_scoring_results.csv")
    feature_df = df_ref.drop(columns=[c for c in _BUANG if c in df_ref.columns])
    
    cat_cols = feature_df.select_dtypes(include="object").columns.tolist()
    num_cols = feature_df.select_dtypes(include=np.number).columns.tolist()
    
    cat_encoded = encoder.get_feature_names_out(cat_cols).tolist()
    
    results = []
    
    # Proses Numerik
    for col in num_cols:
        results.append({
            "Nama Kolom": col,
            "Tipe Fitur Asli": "Numerik",
            "Metode Preprocessing": "StandardScaler / MinMaxScaler",
            "Alasan Preprocessing": "Menyamakan skala data agar tidak ada fitur dominan dalam perhitungan model."
        })
        
    # Proses Kategorikal (One-Hot Encoded)
    for col in cat_encoded:
        # Cari parent feature
        parent_col = next((c for c in cat_cols if col.startswith(c + "_")), "Unknown")
        results.append({
            "Nama Kolom": col,
            "Tipe Fitur Asli": f"Kategorikal ({parent_col})",
            "Metode Preprocessing": "One-Hot Encoding (OHE)",
            "Alasan Preprocessing": "Mengubah teks ke biner (0/1) agar model membaca kategori independen tanpa hierarki nilai."
        })
        
    # Tampilkan dalam bentuk DataFrame (Tabel yang rapi)
    pd.set_option('display.max_rows', None)
    pd.set_option('display.max_colwidth', None)
    
    df_results = pd.DataFrame(results)
    
    print(f"\nTotal Baris Kesimpulan: {len(df_results)}\n")
    print(df_results.to_string(index=False))
    
    # Simpan ke CSV jika dibutuhkan
    output_path = OUTPUTS_DIR / "preprocessed_columns_info.csv"
    df_results.to_csv(output_path, index=False)
    print(f"\n✅ Berhasil diekstrak dan disimpan ke: {output_path}")

if __name__ == "__main__":
    main()
