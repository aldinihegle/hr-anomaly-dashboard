"""
train_if.py — Tahap 1: Persiapan Data & Deteksi Anomali
=======================================================
- Memuat dataset
- Pra-pemrosesan (StandardScaler, OneHotEncoder)
- Melatih Isolation Forest
- Menghitung Risk Thresholds
- Menyimpan cache (.npy) untuk Tahap 2
"""

from __future__ import annotations

import json
import logging
import warnings
import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import OneHotEncoder, StandardScaler

warnings.filterwarnings("ignore")

# Konfigurasi logging natural & detail
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# ─────────────────────────────────────────────────────────────────────────────
# 0. KONFIGURASI
# ─────────────────────────────────────────────────────────────────────────────
RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)

BASE_DIR   = Path(__file__).parent
DATASET    = BASE_DIR.parent / "dataset" / "WA_Fn-UseC_-HR-Employee-Attrition.csv"
OUTPUTS    = BASE_DIR / "outputs"
CACHE_DIR  = BASE_DIR / ".cache"
OUTPUTS.mkdir(exist_ok=True)
CACHE_DIR.mkdir(exist_ok=True)

IF_PARAMS = dict(
    n_estimators  = 200,
    max_samples   = 256,   
    contamination = "auto",
    max_features  = 1.0,
    bootstrap     = False,
    random_state  = RANDOM_STATE,
    n_jobs        = -1,
)

P_SEDANG = 90   
P_TINGGI = 95   

# ─────────────────────────────────────────────────────────────────────────────
# 1. PERSIAPAN DATA
# ─────────────────────────────────────────────────────────────────────────────
logging.info(f"=== TAHAP 1: ISOLATION FOREST ===")
logging.info(f"Loading dataset from: {DATASET}")
df_raw = pd.read_csv(DATASET)
logging.info(f"Dataset successfully loaded. Original shape: {df_raw.shape[0]} rows, {df_raw.shape[1]} columns.")

BUANG_KONSTAN    = ["EmployeeCount", "Over18", "StandardHours"]
BUANG_IDENTIFIER = ["EmployeeNumber"]
BUANG_OUTCOME    = ["Attrition"]

logging.info(f"Dropping constant/identifier/outcome features...")
df = df_raw.drop(columns=BUANG_KONSTAN + BUANG_IDENTIFIER + BUANG_OUTCOME, errors="ignore")

CAT_COLS = df.select_dtypes(include="object").columns.tolist()
NUM_COLS = df.select_dtypes(include=np.number).columns.tolist()
logging.info(f"Feature selection complete. Total active features: {df.shape[1]}")
logging.info(f"Categorical features ({len(CAT_COLS)}): {CAT_COLS}")
logging.info(f"Numerical features ({len(NUM_COLS)}): {NUM_COLS}")

# ─────────────────────────────────────────────────────────────────────────────
# 2. PRA-PEMROSESAN
# ─────────────────────────────────────────────────────────────────────────────
logging.info("Starting preprocessing phase...")
scaler  = StandardScaler()
X_num_scaled = scaler.fit_transform(df[NUM_COLS].values)

encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore", drop="first")
X_cat = encoder.fit_transform(df[CAT_COLS])

X_all = np.hstack([X_num_scaled, X_cat])
cat_feature_names = encoder.get_feature_names_out(CAT_COLS).tolist()
all_feature_names = NUM_COLS + cat_feature_names

logging.info(f"Preprocessing completed. Final feature space dimension: {X_all.shape[1]}")
joblib.dump(encoder, OUTPUTS / "encoder.joblib")
joblib.dump(scaler,  OUTPUTS / "scaler.joblib")

# ─────────────────────────────────────────────────────────────────────────────
# 3. ISOLATION FOREST
# ─────────────────────────────────────────────────────────────────────────────
max_samples = min(IF_PARAMS["max_samples"], X_all.shape[0])
logging.info(f"Initializing IsolationForest with parameters: n_estimators={IF_PARAMS['n_estimators']}, max_samples={max_samples}")

start_time = time.time()
if_model = IsolationForest(
    n_estimators  = IF_PARAMS["n_estimators"],
    max_samples   = max_samples,
    contamination = IF_PARAMS["contamination"],
    max_features  = IF_PARAMS["max_features"],
    bootstrap     = IF_PARAMS["bootstrap"],
    random_state  = IF_PARAMS["random_state"],
    n_jobs        = IF_PARAMS["n_jobs"],
)
if_model.fit(X_all)
logging.info(f"IsolationForest fitting completed in {time.time() - start_time:.2f} seconds.")

raw_scores = -if_model.score_samples(X_all)
min_s, max_s = raw_scores.min(), raw_scores.max()
anomaly_score_if = (raw_scores - min_s) / (max_s - min_s)

logging.info(f"Anomaly scores min-max normalized. Min: {anomaly_score_if.min():.4f}, Mean: {anomaly_score_if.mean():.4f}, Max: {anomaly_score_if.max():.4f}")
joblib.dump(if_model, OUTPUTS / "isolation_forest_model.joblib")

# ─────────────────────────────────────────────────────────────────────────────
# 4. KATEGORISASI RISIKO
# ─────────────────────────────────────────────────────────────────────────────
logging.info("Evaluating empirical percentiles for risk thresholding...")
threshold_p90 = float(np.percentile(anomaly_score_if, P_SEDANG))
threshold_p95 = float(np.percentile(anomaly_score_if, P_TINGGI))

def assign_risk(score: float) -> str:
    if score >= threshold_p95: return "tinggi"
    if score >= threshold_p90: return "sedang"
    return "rendah"

risk_categories = np.array([assign_risk(s) for s in anomaly_score_if])
n_rendah = int((risk_categories == "rendah").sum())
n_sedang = int((risk_categories == "sedang").sum())
n_tinggi = int((risk_categories == "tinggi").sum())
n_total  = len(risk_categories)

logging.info(f"Calculated Threshold P90: {threshold_p90:.6f}")
logging.info(f"Calculated Threshold P95: {threshold_p95:.6f}")
logging.info(f"Risk segmentation results -> Low Risk: {n_rendah} ({n_rendah/n_total*100:.1f}%), Medium Risk: {n_sedang} ({n_sedang/n_total*100:.1f}%), High Risk: {n_tinggi} ({n_tinggi/n_total*100:.1f}%)")

# ─────────────────────────────────────────────────────────────────────────────
# 5. EXPORT CACHE & ARTIFACTS
# ─────────────────────────────────────────────────────────────────────────────
logging.info("Saving cache for Stage 2 (XGBoost)...")
np.save(CACHE_DIR / "X_all.npy", X_all)
np.save(CACHE_DIR / "anomaly_score_if.npy", anomaly_score_if)
np.save(CACHE_DIR / "risk_categories.npy", risk_categories)

with open(CACHE_DIR / "feature_names.json", "w") as f:
    json.dump(all_feature_names, f)

# Simpan tabel CSV awal untuk hasil scoring
df_results = df_raw.copy()
df_results["anomaly_score_if"] = anomaly_score_if
df_results["risk_category"]    = risk_categories
df_results.drop(columns=BUANG_KONSTAN + BUANG_IDENTIFIER, errors="ignore", inplace=True)
df_results.to_csv(OUTPUTS / "anomaly_scoring_results.csv", index=False)

df_dist = pd.DataFrame([
    {"kategori": "rendah", "jumlah": n_rendah, "persentase": n_rendah/n_total*100},
    {"kategori": "sedang", "jumlah": n_sedang, "persentase": n_sedang/n_total*100},
    {"kategori": "tinggi", "jumlah": n_tinggi, "persentase": n_tinggi/n_total*100},
])
df_dist.to_csv(OUTPUTS / "tabel_distribusi_risiko.csv", index=False)

df_stats = pd.DataFrame([
    {"statistik": "Mean",  "nilai": float(anomaly_score_if.mean())},
    {"statistik": "Std",   "nilai": float(anomaly_score_if.std())},
    {"statistik": "Min",   "nilai": float(anomaly_score_if.min())},
    {"statistik": "Max",   "nilai": float(anomaly_score_if.max())},
    {"statistik": "P50",   "nilai": float(np.percentile(anomaly_score_if, 50))},
    {"statistik": "P90",   "nilai": threshold_p90},
    {"statistik": "P95",   "nilai": threshold_p95},
])
df_stats.to_csv(OUTPUTS / "tabel_statistik_anomaly_score.csv", index=False)

df_thresh = pd.DataFrame([
    {"kategori": "rendah", "kondisi": f"< P{P_SEDANG}",          "threshold": threshold_p90},
    {"kategori": "sedang", "kondisi": f"P{P_SEDANG} ≤ x < P{P_TINGGI}", "threshold": threshold_p95},
    {"kategori": "tinggi", "kondisi": f"≥ P{P_TINGGI}",          "threshold": threshold_p95},
])
df_thresh.to_csv(OUTPUTS / "tabel_threshold_anomali.csv", index=False)

logging.info("Stage 1 completed successfully! Cache saved to .cache/ folder.")
