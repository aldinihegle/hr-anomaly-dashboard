import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path
import textwrap

BASE_DIR = Path(__file__).parent
OUTPUTS_DIR = BASE_DIR / "outputs"

def wrap_text(text, width=50):
    return "\n".join(textwrap.wrap(text, width=width))

def main():
    # Buat DataFrame 2 Baris secara manual
    results = [
        {
            "Grup Fitur Asli": "Numerik (23 Kolom)",
            "Contoh Kolom": wrap_text("Age, DailyRate, DistanceFromHome, dll", width=25),
            "Metode Preprocessing": "StandardScaler / MinMaxScaler",
            "Alasan Preprocessing": wrap_text("Menyamakan skala data agar tidak ada fitur dominan dalam perhitungan model.")
        },
        {
            "Grup Fitur Asli": "Kategorikal (7 Kolom asli -> 21 Biner)",
            "Contoh Kolom": wrap_text("BusinessTravel, Department, EducationField, dll", width=25),
            "Metode Preprocessing": "One-Hot Encoding (OHE)",
            "Alasan Preprocessing": wrap_text("Mengubah teks ke biner (0/1) agar model membaca kategori independen tanpa hierarki nilai.")
        }
    ]
    df = pd.DataFrame(results)
    
    fig, ax = plt.subplots(figsize=(22, 4)) # Lebar diperbesar agar tidak terpotong
    ax.axis('off')
    
    # Buat tabel dengan bounding box yang pas
    table = ax.table(cellText=df.values, colLabels=df.columns, loc='center', cellLoc='left', bbox=[0, 0, 1, 1])
    
    # Styling Tabel
    table.auto_set_font_size(False)
    table.set_fontsize(12)
    table.auto_set_column_width(col=list(range(len(df.columns))))
    table.scale(1, 2.5) # Tambah padding vertikal agar selonggar mungkin
    
    # Hitam Putih / Grayscale
    for i in range(len(df.columns)):
        cell = table[0, i]
        cell.set_text_props(weight='bold', color='black')
        cell.set_facecolor('#E2E8F0') # Abu-abu terang untuk header
        cell.set_edgecolor('black')
    
    for i in range(1, len(df) + 1):
        for j in range(len(df.columns)):
            cell = table[i, j]
            cell.set_edgecolor('black')
            if i % 2 == 0:
                cell.set_facecolor('#F8FAFC')
            else:
                cell.set_facecolor('#FFFFFF')
                
    output_path = OUTPUTS_DIR / "preprocessed_columns_summary.png"
    plt.title("Ringkasan Preprocessing Fitur Model", fontsize=16, fontweight='bold', pad=20)
    plt.savefig(output_path, dpi=200, bbox_inches='tight', facecolor='white')
    print(f"✅ Berhasil disimpan ke: {output_path}")

if __name__ == "__main__":
    main()
