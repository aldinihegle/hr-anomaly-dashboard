import os
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
import textwrap

BASE_DIR = Path(__file__).parent
OUTPUTS_DIR = BASE_DIR / "outputs"

def wrap_text(text, width=40):
    return "\n".join(textwrap.wrap(text, width=width))

def main():
    df = pd.read_csv(OUTPUTS_DIR / "preprocessed_columns_info.csv")
    
    # Wrap text agar muat
    df["Alasan Preprocessing"] = df["Alasan Preprocessing"].apply(lambda x: wrap_text(x, width=45))
    
    # Hitung tinggi optimal berdasarkan jumlah baris
    fig_height = len(df) * 0.8 + 2
    fig, ax = plt.subplots(figsize=(22, fig_height)) # Lebar diperbesar agar tidak terpotong
    ax.axis('off')
    
    # Buat tabel dengan bounding box yang jelas agar tidak menabrak title
    table = ax.table(cellText=df.values, colLabels=df.columns, loc='center', cellLoc='left', bbox=[0, 0, 1, 1])
    
    # Set lebar kolom otomatis menyesuaikan panjang teks
    table.auto_set_column_width(col=list(range(len(df.columns))))
    
    # Styling Tabel
    table.auto_set_font_size(False)
    table.set_fontsize(11)
    table.scale(1, 1.8) # Tambah padding vertikal agar selonggar mungkin
    
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
                cell.set_facecolor('#F8FAFC') # Abu-abu sangat pucat
            else:
                cell.set_facecolor('#FFFFFF') # Putih
                
    # Membuat efek "Merged Cell" (Rowspan) untuk kolom Metode (idx 2) dan Alasan (idx 3)
    num_indices = [i for i, val in enumerate(df["Tipe Fitur Asli"]) if val.startswith("Numerik")]
    cat_indices = [i for i, val in enumerate(df["Tipe Fitur Asli"]) if val.startswith("Kategorikal")]
    
    def setup_merged_group(indices, col_idx):
        if not indices: return
        start = indices[0] + 1 # +1 karena row 0 adalah header
        end = indices[-1] + 1
        mid = (start + end) // 2
        
        for i in range(start, end + 1):
            cell = table[i, col_idx]
            cell.set_facecolor('#FFFFFF') # Background putih polos agar terlihat menyatu
            
            # Atur border agar menyambung vertikal
            if i == start:
                cell.visible_edges = "TLR" # Top, Left, Right
            elif i == end:
                cell.visible_edges = "BLR" # Bottom, Left, Right
            else:
                cell.visible_edges = "LR"  # Left, Right
                
            # Hapus teks selain di tengah
            if i != mid:
                cell.get_text().set_text("")
                
    for col_idx in [2, 3]: # Kolom Metode dan Alasan
        setup_merged_group(num_indices, col_idx)
        setup_merged_group(cat_indices, col_idx)
                
    output_path = OUTPUTS_DIR / "preprocessed_columns_info.png"
    plt.title("Daftar Fitur Setelah Preprocessing", fontsize=18, fontweight='bold', pad=30)
    plt.savefig(output_path, dpi=200, bbox_inches='tight', facecolor='white')
    print(f"✅ Berhasil disimpan ke: {output_path}")

if __name__ == "__main__":
    main()
