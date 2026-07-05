import pandas as pd
from pathlib import Path

# Paths
DATASET_PATH = Path("/Users/aldinihegle/Kuliah/Development Model/hr-anomaly-dashboard/dataset/WA_Fn-UseC_-HR-Employee-Attrition.csv")
OUTPUT_CSV = Path("/Users/aldinihegle/Kuliah/Development Model/hr-anomaly-dashboard/model/outputs/tabel_lampiran1_atribut.csv")
MD_OUTPUT = Path("/Users/aldinihegle/.gemini/antigravity-ide/brain/373df467-ec8c-480a-a381-b37b3ea1a61f/lampiran1_atribut.md")

def main():
    if not DATASET_PATH.exists():
        print(f"File {DATASET_PATH} tidak ditemukan!")
        return
        
    df = pd.read_csv(DATASET_PATH)
    
    results = []
    
    for idx, col in enumerate(df.columns):
        # Determine Data Type
        dtype = df[col].dtype
        if pd.api.types.is_numeric_dtype(dtype):
            if pd.api.types.is_float_dtype(dtype):
                tipe_data = "Numerik (Float)"
            else:
                tipe_data = "Numerik (Integer)"
        else:
            tipe_data = "Kategorikal (Teks)"
            
        results.append({
            "No.": idx + 1,
            "Nama Atribut": col,
            "Tipe Data": tipe_data
        })
        
    df_results = pd.DataFrame(results)
    
    # Save to CSV
    df_results.to_csv(OUTPUT_CSV, index=False, sep=";")
    print(f"CSV tersimpan di: {OUTPUT_CSV}")
    
    # Generate Markdown Table
    with open(MD_OUTPUT, "w") as f:
        f.write("## Lampiran 1: Sample dataset dan daftar atribut\n\n")
        f.write("| No. | Nama Atribut | Tipe Data |\n")
        f.write("|:---:|:---|:---|\n")
        
        for _, row in df_results.iterrows():
            f.write(f"| {row['No.']} | {row['Nama Atribut']} | {row['Tipe Data']} |\n")
            
    print(f"Markdown tersimpan di: {MD_OUTPUT}")

if __name__ == "__main__":
    main()
