#!/usr/bin/env python3
"""
Compute SHAP local values for ALL employees and save to CSV.

CATATAN: development_ml.py sudah menghasilkan shap_local_all.csv
secara otomatis di folder outputs/. Script ini hanya diperlukan
jika ingin REGENERASI ulang tanpa menjalankan pipeline penuh.

Semua artefak dibaca dari outputs/ folder lokal (self-contained).

Usage (dari folder hr-anomaly-dashboard/model/):
    python compute_shap_all.py

Output:
    outputs/shap_local_all.csv  — kolom: employee_idx, feature, shap_value
"""
from __future__ import annotations

import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap

# ── Paths (lokal, self-contained) ─────────────────────────────────────────
SCRIPT_DIR  = Path(__file__).parent
OUTPUTS_DIR = Path(os.environ.get("OUTPUTS_DIR", str(SCRIPT_DIR / "outputs")))
OUT_CSV     = OUTPUTS_DIR / "shap_local_all.csv"

print("📂  Outputs dir:", OUTPUTS_DIR)
print("💾  Output CSV: ", OUT_CSV)

# ── Kolom yang dibuang (sesuai development_ml.py) ─────────────────────────
_BUANG = {"EmployeeCount", "Over18", "StandardHours", "EmployeeNumber",
          "Attrition", "anomaly_score_if", "risk_category"}

# ── Load artifacts ─────────────────────────────────────────────────────────
print("🔄  Loading artifacts…")
encoder            = joblib.load(OUTPUTS_DIR / "encoder.joblib")
scaler             = joblib.load(OUTPUTS_DIR / "scaler.joblib")
surrogate_pipeline = joblib.load(OUTPUTS_DIR / "xgboost_surrogate_pipeline.joblib")

# ── Load raw data ──────────────────────────────────────────────────────────
df_all    = pd.read_csv(OUTPUTS_DIR / "anomaly_scoring_results.csv")
feature_df = df_all.drop(columns=[c for c in _BUANG if c in df_all.columns])

cat_cols = feature_df.select_dtypes(include="object").columns.tolist()
num_cols = feature_df.select_dtypes(include=np.number).columns.tolist()

print(f"📊  Karyawan: {len(feature_df)} | Cat: {len(cat_cols)} | Num: {len(num_cols)}")

# ── Preprocessing: scaler(num) + encoder(cat) → hstack — identik dengan training ──
X_num = scaler.transform(feature_df[num_cols].values)
X_cat = encoder.transform(feature_df[cat_cols])
X_all = np.hstack([X_num, X_cat])

cat_names    = encoder.get_feature_names_out(cat_cols).tolist()
feat_names   = num_cols + cat_names

print(f"🔤  Total fitur setelah encoding: {X_all.shape[1]}")

# ── Extract XGBoost dari Pipeline ─────────────────────────────────────────
xgb_model = surrogate_pipeline.named_steps["model"]
print(f"🌳  XGBoost type: {type(xgb_model).__name__}")

# ── Compute SHAP (batch untuk efisiensi memori) ────────────────────────────
print("⚙️   Computing SHAP values (TreeExplainer)…")
explainer = shap.TreeExplainer(xgb_model)

BATCH    = 200
all_rows = []
n        = len(X_all)

for start in range(0, n, BATCH):
    end = min(start + BATCH, n)
    sv  = explainer.shap_values(X_all[start:end])
    for local_idx, shap_vals in enumerate(sv):
        emp_idx = start + local_idx
        for feat_i, feat_name in enumerate(feat_names):
            val = float(shap_vals[feat_i])
            if val != 0.0:
                all_rows.append((emp_idx, feat_name, val))
    print(f"  {end}/{n} ({int(end/n*100)}%)", end="\r", flush=True)

print()
print(f"✅  SHAP values: {len(all_rows):,} non-zero entries")

# ── Simpan ─────────────────────────────────────────────────────────────────
df_out = pd.DataFrame(all_rows, columns=["employee_idx", "feature", "shap_value"])
df_out.to_csv(OUT_CSV, index=False)
print(f"💾  Saved to {OUT_CSV}")
print(f"📈  Unique employees: {df_out['employee_idx'].nunique()}")
print(f"📈  Unique features:  {df_out['feature'].nunique()}")

# Process in batches to avoid memory issues
BATCH = 200
all_rows = []
n = len(X_model)

for start in range(0, n, BATCH):
    end = min(start + BATCH, n)
    sv = explainer.shap_values(X_model[start:end])
    # sv shape: (batch, n_features)
    for local_idx, shap_vals in enumerate(sv):
        emp_idx = start + local_idx   # 0-based index → maps to employee_id = idx+1
        for feat_i, feat_name in enumerate(feature_names):
            val = float(shap_vals[feat_i])
            if val != 0.0:   # Only store non-zero SHAP values
                all_rows.append((emp_idx, feat_name, val))

    pct = int((end / n) * 100)
    print(f"  {end}/{n} ({pct}%)", end="\r", flush=True)

print()
print(f"✅  SHAP values computed: {len(all_rows)} non-zero entries")

# ── Save ───────────────────────────────────────────────────────────────────
df_out = pd.DataFrame(all_rows, columns=["employee_idx", "feature", "shap_value"])
df_out.to_csv(OUT_CSV, index=False)
print(f"💾  Saved to {OUT_CSV}")
print(f"📈  Unique employees: {df_out['employee_idx'].nunique()}")
print(f"📈  Unique features:  {df_out['feature'].nunique()}")
