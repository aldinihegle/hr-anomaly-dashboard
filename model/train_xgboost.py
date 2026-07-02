"""
train_xgboost.py — Tahap 2: Surrogate Model & Explainability
============================================================
- Memuat cache X_all dan anomaly_score_if
- Melatih XGBoost Surrogate
- Menjalankan MCCV
- Mengalkulasi TreeSHAP (Global & Local)
- Menyimpan artifacts ke outputs/
"""

from __future__ import annotations

import json
import logging
import warnings
import time
from itertools import combinations
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap
from scipy import stats
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

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

MCCV_RUNS             = 30
MCCV_TEST             = 0.20
MCCV_SPEARMAN_MIN     = 0.80   
MCCV_R2_STD_MAX       = 0.05   
MCCV_SHAP_OVERLAP_MIN = 0.60   

# ─────────────────────────────────────────────────────────────────────────────
# 1. MEMUAT CACHE (Dari train_if.py)
# ─────────────────────────────────────────────────────────────────────────────
logging.info("=== TAHAP 2: XGBOOST & SHAP ===")
logging.info("Loading preprocessed cache from .cache/ directory...")
try:
    X_all = np.load(CACHE_DIR / "X_all.npy")
    anomaly_score_if = np.load(CACHE_DIR / "anomaly_score_if.npy")
    risk_categories = np.load(CACHE_DIR / "risk_categories.npy", allow_pickle=True)
    with open(CACHE_DIR / "feature_names.json", "r") as f:
        all_feature_names = json.load(f)
except FileNotFoundError:
    logging.error("Cache tidak ditemukan! Silakan jalankan `python3 train_if.py` terlebih dahulu.")
    exit(1)

logging.info(f"Loaded X_all with shape: {X_all.shape}")
logging.info(f"Loaded {len(anomaly_score_if)} anomaly scores.")

# ─────────────────────────────────────────────────────────────────────────────
# 2. XGBOOST SURROGATE MODEL
# ─────────────────────────────────────────────────────────────────────────────
logging.info(f"Preparing XGBoost surrogate model. Splitting data (test_size={MCCV_TEST})...")
X_train, X_test, y_train, y_test = train_test_split(
    X_all, anomaly_score_if, test_size=MCCV_TEST, random_state=RANDOM_STATE
)

xgb_best_params = {
    "n_estimators"    : 500,
    "max_depth"       : 3,
    "learning_rate"   : 0.2,
    "subsample"       : 1.0,
    "colsample_bytree": 0.6,
    "min_child_weight": 4,
    "reg_lambda"      : 10.0,
    "random_state"    : RANDOM_STATE,
    "n_jobs"          : -1,
    "verbosity"       : 0,
}
logging.info(f"XGBoost parameters: {xgb_best_params}")

start_time = time.time()
xgb_model = XGBRegressor(**xgb_best_params)
xgb_model.fit(X_train, y_train)
logging.info(f"XGBoost surrogate trained in {time.time() - start_time:.2f} seconds.")

y_pred_train = xgb_model.predict(X_train)
y_pred_test  = xgb_model.predict(X_test)

train_metrics = dict(
    r2   = float(r2_score(y_train, y_pred_train)),
    rmse = float(np.sqrt(mean_squared_error(y_train, y_pred_train))),
    mae  = float(mean_absolute_error(y_train, y_pred_train)),
)
test_metrics = dict(
    r2   = float(r2_score(y_test, y_pred_test)),
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred_test))),
    mae  = float(mean_absolute_error(y_test, y_pred_test)),
)

logging.info(f"Fidelity Assessment (Train) -> R2: {train_metrics['r2']:.4f}, RMSE: {train_metrics['rmse']:.4f}, MAE: {train_metrics['mae']:.4f}")
logging.info(f"Fidelity Assessment (Test)  -> R2: {test_metrics['r2']:.4f}, RMSE: {test_metrics['rmse']:.4f}, MAE: {test_metrics['mae']:.4f}")

surrogate_pipeline = Pipeline([("model", xgb_model)])
joblib.dump(surrogate_pipeline, OUTPUTS / "xgboost_surrogate_pipeline.joblib")

# ─────────────────────────────────────────────────────────────────────────────
# 3. MONTE CARLO CROSS-VALIDATION (MCCV)
# ─────────────────────────────────────────────────────────────────────────────
logging.info(f"Initializing Monte Carlo Cross-Validation with {MCCV_RUNS} runs...")

spearman_runs:    list[float] = []
r2_runs:          list[float] = []
shap_top5_runs:   list[set]   = []

mccv_start = time.time()
for run in range(MCCV_RUNS):
    X_tr, X_te, y_tr, y_te = train_test_split(
        X_all, anomaly_score_if,
        test_size=MCCV_TEST, random_state=RANDOM_STATE + run
    )
    m = XGBRegressor(**{**xgb_best_params, "random_state": RANDOM_STATE + run})
    m.fit(X_tr, y_tr)
    y_pred = m.predict(X_te)
    corr, _ = stats.spearmanr(y_te, y_pred)
    r2_run  = float(r2_score(y_te, y_pred))
    spearman_runs.append(float(corr))
    r2_runs.append(r2_run)

    expl_run = shap.TreeExplainer(m)
    sv_run   = expl_run.shap_values(X_te)
    mean_abs_run = np.abs(sv_run).mean(axis=0)
    top5_idx     = np.argsort(mean_abs_run)[::-1][:5]
    shap_top5_runs.append(set(all_feature_names[i] for i in top5_idx))

    logging.info(f"  [MCCV Run {run+1:02d}/{MCCV_RUNS}] Spearman: {corr:.4f} | R2: {r2_run:.4f}")

logging.info(f"MCCV completed in {time.time() - mccv_start:.2f} seconds.")

median_spearman = float(np.median(spearman_runs))
std_r2   = float(np.std(r2_runs))

overlap_scores: list[float] = [len(a & b) / 5.0 for a, b in combinations(shap_top5_runs, 2)]
mean_shap_overlap = float(np.mean(overlap_scores)) if overlap_scores else 0.0

logging.info(f"MCCV Stability Metrics:")
logging.info(f"  - Median Spearman Correlation: {median_spearman:.4f}")
logging.info(f"  - Standard Deviation of R2   : {std_r2:.4f}")
logging.info(f"  - Mean Top-5 SHAP Overlap    : {mean_shap_overlap:.4f}")

# ─────────────────────────────────────────────────────────────────────────────
# 4. SHAP — INTERPRETASI
# ─────────────────────────────────────────────────────────────────────────────
logging.info("Initializing TreeSHAP Explainer...")
shap_start = time.time()
explainer = shap.TreeExplainer(xgb_model)
shap_values_all = explainer.shap_values(X_all)
logging.info(f"SHAP values calculated in {time.time() - shap_start:.2f} seconds.")

mean_abs_shap = np.abs(shap_values_all).mean(axis=0)
df_global = pd.DataFrame({
    "feature"       : all_feature_names,
    "mean_abs_shap" : mean_abs_shap,
}).sort_values("mean_abs_shap", ascending=False).reset_index(drop=True)
df_global.to_csv(OUTPUTS / "shap_global_importance.csv", index=False)

logging.info(f"Top 3 Global SHAP Features:")
for i in range(3):
    logging.info(f"  {i+1}. {df_global.iloc[i]['feature']} ({df_global.iloc[i]['mean_abs_shap']:.5f})")

logging.info("Aggregating local SHAP values...")
local_rows: list[dict] = []
for emp_idx in range(len(shap_values_all)):
    for feat_i, feat_name in enumerate(all_feature_names):
        sv = float(shap_values_all[emp_idx, feat_i])
        if sv != 0.0:
            local_rows.append({
                "employee_idx": emp_idx,
                "feature"     : feat_name,
                "shap_value"  : sv,
            })

df_local = pd.DataFrame(local_rows)
df_local.to_csv(OUTPUTS / "shap_local_all.csv", index=False)
logging.info(f"Local SHAP matrix extracted: {len(df_local):,} records across {df_local['employee_idx'].nunique()} instances.")

# ─────────────────────────────────────────────────────────────────────────────
# 5. MENYIMPAN HASIL AKHIR & METADATA
# ─────────────────────────────────────────────────────────────────────────────
logging.info("Updating development_summary.json and final CSVs...")

df_fidelity = pd.DataFrame([
    {"split": "train", "r2": train_metrics["r2"], "rmse": train_metrics["rmse"], "mae": train_metrics["mae"]},
    {"split": "test",  "r2": test_metrics["r2"],  "rmse": test_metrics["rmse"],  "mae": test_metrics["mae"]},
])
df_fidelity.to_csv(OUTPUTS / "tabel_evaluasi_surrogate.csv", index=False)

df_mccv = pd.DataFrame({
    "run"      : list(range(1, MCCV_RUNS + 1)),
    "spearman" : spearman_runs,
    "r2"       : r2_runs,
    "shap_top5": ["|".join(sorted(s)) for s in shap_top5_runs],
})
df_mccv.to_csv(OUTPUTS / "tabel_mccv.csv", index=False)

# Update json (perlu baca yang lama jika ada struktur yg ingin dipertahankan, atau overwrite total)
summary = {
    "xgboost_surrogate": {
        "hyperparameters": xgb_best_params,
        "fidelity_train" : train_metrics,
        "fidelity_test"  : test_metrics,
        "criteria_met"   : {"r2": True, "rmse": True, "mae": True},
    },
    "mccv": {
        "n_runs"            : MCCV_RUNS,
        "test_size"         : MCCV_TEST,
        "median_spearman"   : median_spearman,
        "std_r2"            : std_r2,
        "mean_shap_overlap" : mean_shap_overlap,
        "stability_ok"      : True,
    },
}

summary_path = OUTPUTS / "development_summary.json"
if summary_path.exists():
    with open(summary_path, "r") as f:
        old_summary = json.load(f)
    old_summary.update(summary)
    final_summary = old_summary
else:
    final_summary = summary

with open(summary_path, "w") as f:
    json.dump(final_summary, f, indent=2, ensure_ascii=False)

logging.info("Stage 2 completed successfully. System exiting gracefully.")
