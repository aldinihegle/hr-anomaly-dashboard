"""
development_ml.py — Pipeline Utama Penelitian
==============================================
Deteksi Anomali Profil Kinerja Karyawan Menggunakan
Isolation Forest dengan Interpretasi XGBoost-SHAP

Metodologi (sesuai Bab III skripsi):
  Tahap 1 : Isolation Forest — detektor anomali utama
  Tahap 2 : XGBoost Surrogate — aproksimasi skor IF
           SHAP (TreeSHAP) — interpretasi global & lokal
  Validasi : Monte Carlo Cross-Validation (MCCV)
  Kategorisasi : risiko rendah/sedang/tinggi berbasis P90/P95

Keluaran (folder outputs/):
  isolation_forest_model.joblib
  xgboost_surrogate_pipeline.joblib
  encoder.joblib
  scaler.joblib
  anomaly_scoring_results.csv
  shap_global_importance.csv
  shap_local_all.csv
  tabel_distribusi_risiko.csv
  tabel_statistik_anomaly_score.csv
  tabel_evaluasi_surrogate.csv
  tabel_threshold_anomali.csv
  development_summary.json

Author : Aldini Hegle Pratama — 2202921
"""

from __future__ import annotations

import json
import warnings
from itertools import combinations
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap
from scipy import stats
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────────────────────────────────
# 0. KONFIGURASI
# ─────────────────────────────────────────────────────────────────────────────

RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)

# Path
BASE_DIR   = Path(__file__).parent
DATASET    = BASE_DIR.parent / "dataset" / "WA_Fn-UseC_-HR-Employee-Attrition.csv"
OUTPUTS    = BASE_DIR / "outputs"
OUTPUTS.mkdir(exist_ok=True)

# Isolation Forest hyperparameters (Bab III skripsi)
IF_PARAMS = dict(
    n_estimators  = 200,
    max_samples   = 256,   # sesuai skripsi; fallback ke len(X_train) bila lebih kecil
    contamination = "auto",
    max_features  = 1.0,
    bootstrap     = False,
    random_state  = RANDOM_STATE,
    n_jobs        = -1,
)

# Risk threshold percentiles (Bab III skripsi)
P_SEDANG = 90   # ≥ P90 → sedang
P_TINGGI = 95   # ≥ P95 → tinggi

# XGBoost surrogate fidelity criteria (Bab III skripsi)
FIDELITY_R2_MIN   = 0.80
FIDELITY_RMSE_PCT = 0.10   # RMSE ≤ 10% rentang skor
FIDELITY_MAE_PCT  = 0.05   # MAE  ≤  5% rentang skor

# MCCV
MCCV_RUNS             = 30
MCCV_TEST             = 0.20
MCCV_SPEARMAN_MIN     = 0.80   # median Spearman ≥ 0.80  (Bab III skripsi)
MCCV_R2_STD_MAX       = 0.05   # simpangan baku R² ≤ 0.05 (Bab III skripsi)
MCCV_SHAP_OVERLAP_MIN = 0.60   # rata-rata overlap top-5 SHAP ≥ 60% (Bab III skripsi)

# ─────────────────────────────────────────────────────────────────────────────
# 1. PERSIAPAN DATA
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "="*65)
print("  TAHAP 1 — PERSIAPAN DATA")
print("="*65)

df_raw = pd.read_csv(DATASET)
print(f"Dataset dimuat: {df_raw.shape[0]} baris × {df_raw.shape[1]} kolom")

# Kolom yang dibuang (Tabel 3.1 skripsi)
BUANG_KONSTAN    = ["EmployeeCount", "Over18", "StandardHours"]
BUANG_IDENTIFIER = ["EmployeeNumber"]
BUANG_OUTCOME    = ["Attrition"]

# Simpan Attrition terpisah sebagai konteks (proxy evaluation)
attrition_col = df_raw["Attrition"].copy()

# Drop kolom yang dibuang
df = df_raw.drop(columns=BUANG_KONSTAN + BUANG_IDENTIFIER + BUANG_OUTCOME, errors="ignore")
print(f"Setelah seleksi atribut: {df.shape[0]} baris × {df.shape[1]} fitur")

# Identifikasi kolom kategorikal dan numerikal
CAT_COLS = df.select_dtypes(include="object").columns.tolist()
NUM_COLS = df.select_dtypes(include=np.number).columns.tolist()
print(f"Fitur kategorikal : {len(CAT_COLS)} — {CAT_COLS}")
print(f"Fitur numerikal   : {len(NUM_COLS)}")

# ─────────────────────────────────────────────────────────────────────────────
# 2. PRA-PEMROSESAN (One-Hot Encoding + StandardScaler)
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "="*65)
print("  TAHAP 2 — PRA-PEMROSESAN")
print("="*65)

encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore", drop="first")
scaler  = StandardScaler()

# Fit pada seluruh data (tidak ada target; ini unsupervised)
X_cat = encoder.fit_transform(df[CAT_COLS])
X_num = df[NUM_COLS].values
X_num_scaled = scaler.fit_transform(X_num)
X_all = np.hstack([X_num_scaled, X_cat])

# Nama fitur setelah encoding
cat_feature_names = encoder.get_feature_names_out(CAT_COLS).tolist()
all_feature_names = NUM_COLS + cat_feature_names
print(f"Total fitur setelah encoding: {X_all.shape[1]}")

# Simpan encoder & scaler
joblib.dump(encoder, OUTPUTS / "encoder.joblib")
joblib.dump(scaler,  OUTPUTS / "scaler.joblib")

# ─────────────────────────────────────────────────────────────────────────────
# 3. TAHAP-1: ISOLATION FOREST
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "="*65)
print("  TAHAP 3 — ISOLATION FOREST (Detektor Anomali Utama)")
print("="*65)

# Sesuaikan max_samples bila data < 256
max_samples = min(IF_PARAMS["max_samples"], X_all.shape[0])

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
print(f"Isolation Forest dilatih: n_estimators={IF_PARAMS['n_estimators']}, "
      f"max_samples={max_samples}, contamination=auto")

# Skor anomali raw: score_samples() → lebih negatif = lebih anomali
# Dibalik agar lebih tinggi = lebih anomali, lalu normalisasi ke [0,1]
raw_scores = -if_model.score_samples(X_all)
min_s, max_s = raw_scores.min(), raw_scores.max()
anomaly_score_if = (raw_scores - min_s) / (max_s - min_s)

print(f"Skor anomali IF — min: {anomaly_score_if.min():.4f} | "
      f"mean: {anomaly_score_if.mean():.4f} | max: {anomaly_score_if.max():.4f}")

# Simpan model
joblib.dump(if_model, OUTPUTS / "isolation_forest_model.joblib")

# ─────────────────────────────────────────────────────────────────────────────
# 4. KATEGORISASI RISIKO (P90/P95)
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "="*65)
print("  TAHAP 4 — KATEGORISASI RISIKO (P90/P95)")
print("="*65)

threshold_p90 = float(np.percentile(anomaly_score_if, P_SEDANG))
threshold_p95 = float(np.percentile(anomaly_score_if, P_TINGGI))

def assign_risk(score: float) -> str:
    if score >= threshold_p95:
        return "tinggi"
    if score >= threshold_p90:
        return "sedang"
    return "rendah"

risk_categories = np.array([assign_risk(s) for s in anomaly_score_if])

n_rendah = int((risk_categories == "rendah").sum())
n_sedang = int((risk_categories == "sedang").sum())
n_tinggi = int((risk_categories == "tinggi").sum())
n_total  = len(risk_categories)

print(f"Threshold P90 (sedang) : {threshold_p90:.6f}")
print(f"Threshold P95 (tinggi) : {threshold_p95:.6f}")
print(f"Rendah : {n_rendah} ({n_rendah/n_total*100:.1f}%)")
print(f"Sedang : {n_sedang} ({n_sedang/n_total*100:.1f}%)")
print(f"Tinggi : {n_tinggi} ({n_tinggi/n_total*100:.1f}%)")

# ─────────────────────────────────────────────────────────────────────────────
# 5. TAHAP-2: XGBOOST SURROGATE MODEL
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "="*65)
print("  TAHAP 5 — XGBOOST SURROGATE MODEL")
print("="*65)

# Train-test split (80/20)
X_train, X_test, y_train, y_test = train_test_split(
    X_all, anomaly_score_if,
    test_size=MCCV_TEST, random_state=RANDOM_STATE
)
print(f"Train: {len(X_train)} | Test: {len(X_test)}")

# Hyperparameter terbaik dari V3 (hasil GridSearchCV)
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

xgb_model = XGBRegressor(**xgb_best_params)
xgb_model.fit(X_train, y_train)

# Evaluasi fidelity
y_pred_train = xgb_model.predict(X_train)
y_pred_test  = xgb_model.predict(X_test)

score_range = anomaly_score_if.max() - anomaly_score_if.min()

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

# Validasi fidelity criteria
r2_ok   = test_metrics["r2"]   >= FIDELITY_R2_MIN
rmse_ok = test_metrics["rmse"] <= FIDELITY_RMSE_PCT * score_range
mae_ok  = test_metrics["mae"]  <= FIDELITY_MAE_PCT  * score_range

print(f"\nFidelity Surrogate (Test):")
print(f"  R²   = {test_metrics['r2']:.4f}  {'✅' if r2_ok else '❌'} (≥ {FIDELITY_R2_MIN})")
print(f"  RMSE = {test_metrics['rmse']:.6f}  {'✅' if rmse_ok else '❌'} (≤ {FIDELITY_RMSE_PCT*score_range:.6f})")
print(f"  MAE  = {test_metrics['mae']:.6f}  {'✅' if mae_ok else '❌'} (≤ {FIDELITY_MAE_PCT*score_range:.6f})")

if not (r2_ok and rmse_ok and mae_ok):
    print("⚠️  Satu atau lebih kriteria fidelity belum terpenuhi — SHAP tetap dihitung.")

# Simpan surrogate (wrapper Pipeline agar konsisten dengan preprocessing)
surrogate_pipeline = Pipeline([
    ("model", xgb_model),
])
joblib.dump(surrogate_pipeline, OUTPUTS / "xgboost_surrogate_pipeline.joblib")

# ─────────────────────────────────────────────────────────────────────────────
# 6. MONTE CARLO CROSS-VALIDATION (MCCV) — Stabilitas
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "="*65)
print(f"  TAHAP 6 — MCCV ({MCCV_RUNS} run, test_size={MCCV_TEST})")
print("="*65)

spearman_runs:    list[float] = []
r2_runs:          list[float] = []
shap_top5_runs:   list[set]   = []   # top-5 fitur SHAP per run (untuk overlap)

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

    # SHAP global (mean |SHAP|) pada test set run ini → ambil top-5 fitur
    expl_run = shap.TreeExplainer(m)
    sv_run   = expl_run.shap_values(X_te)
    mean_abs_run = np.abs(sv_run).mean(axis=0)
    top5_idx     = np.argsort(mean_abs_run)[::-1][:5]
    shap_top5_runs.append(set(all_feature_names[i] for i in top5_idx))

    print(f"  Run {run+1:2d}: Spearman={corr:.4f} | R²={r2_run:.4f} | "
          f"Top-5: {sorted(shap_top5_runs[-1])[:2]}…")

# ── Kriteria 1: median Spearman ≥ 0.80 ──────────────────────────────────
median_spearman = float(np.median(spearman_runs))
spearman_ok     = median_spearman >= MCCV_SPEARMAN_MIN

# ── Kriteria 2: simpangan baku R² ≤ 0.05 ────────────────────────────────
std_r2   = float(np.std(r2_runs))
r2_std_ok = std_r2 <= MCCV_R2_STD_MAX

# ── Kriteria 3: rata-rata pairwise overlap top-5 SHAP ≥ 60% ─────────────
# Overlap ratio = |A ∩ B| / 5 untuk setiap pasang run
overlap_scores: list[float] = [
    len(a & b) / 5.0
    for a, b in combinations(shap_top5_runs, 2)
]
mean_shap_overlap = float(np.mean(overlap_scores)) if overlap_scores else 0.0
shap_overlap_ok   = mean_shap_overlap >= MCCV_SHAP_OVERLAP_MIN

print(f"\nStabilitas MCCV ({MCCV_RUNS} run):")
print(f"  Median Spearman    : {median_spearman:.4f}  {'✅' if spearman_ok else '❌'} (≥ {MCCV_SPEARMAN_MIN})")
print(f"  Std R²             : {std_r2:.4f}   {'✅' if r2_std_ok else '❌'} (≤ {MCCV_R2_STD_MAX})")
print(f"  Overlap top-5 SHAP : {mean_shap_overlap:.4f}  {'✅' if shap_overlap_ok else '❌'} (≥ {MCCV_SHAP_OVERLAP_MIN})")
print(f"  Median R²          : {float(np.median(r2_runs)):.4f}")

stability_ok = spearman_ok and r2_std_ok and shap_overlap_ok
if stability_ok:
    print("  → Semua kriteria stabilitas TERPENUHI ✅")
else:
    print("  → Satu atau lebih kriteria stabilitas BELUM terpenuhi ⚠️")

# ─────────────────────────────────────────────────────────────────────────────
# 7. SHAP — INTERPRETASI GLOBAL & LOKAL
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "="*65)
print("  TAHAP 7 — SHAP (TreeSHAP)")
print("="*65)

explainer = shap.TreeExplainer(xgb_model)

print("  Menghitung SHAP values untuk semua karyawan…")
shap_values_all = explainer.shap_values(X_all)   # shape (1470, n_features)

# ── Global SHAP ───────────────────────────────────────────────────────────
mean_abs_shap = np.abs(shap_values_all).mean(axis=0)
df_global = pd.DataFrame({
    "feature"       : all_feature_names,
    "mean_abs_shap" : mean_abs_shap,
}).sort_values("mean_abs_shap", ascending=False).reset_index(drop=True)
df_global.to_csv(OUTPUTS / "shap_global_importance.csv", index=False)
print(f"  Global SHAP disimpan — {len(df_global)} fitur")
print("  Top 5 fitur global:")
for _, row in df_global.head(5).iterrows():
    print(f"    {row['feature']:40s} {row['mean_abs_shap']:.6f}")

# ── Local SHAP (semua karyawan) ────────────────────────────────────────────
print("  Menyimpan local SHAP untuk semua karyawan…")
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
print(f"  Local SHAP disimpan — {len(df_local):,} entri non-zero "
      f"({df_local['employee_idx'].nunique()} karyawan)")

# ─────────────────────────────────────────────────────────────────────────────
# 8. SIMPAN SEMUA HASIL KE CSV
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "="*65)
print("  TAHAP 8 — MENYIMPAN HASIL")
print("="*65)

# anomaly_scoring_results.csv (tanpa LOF — hanya IF)
df_results = df_raw.copy()
df_results["anomaly_score_if"] = anomaly_score_if
df_results["risk_category"]    = risk_categories
# Drop kolom yang dibuang agar konsisten
df_results.drop(columns=BUANG_KONSTAN + BUANG_IDENTIFIER, errors="ignore", inplace=True)
df_results.to_csv(OUTPUTS / "anomaly_scoring_results.csv", index=False)
print(f"  anomaly_scoring_results.csv — {len(df_results)} baris")

# tabel_distribusi_risiko.csv
df_dist = pd.DataFrame([
    {"kategori": "rendah", "jumlah": n_rendah, "persentase": n_rendah/n_total*100},
    {"kategori": "sedang", "jumlah": n_sedang, "persentase": n_sedang/n_total*100},
    {"kategori": "tinggi", "jumlah": n_tinggi, "persentase": n_tinggi/n_total*100},
])
df_dist.to_csv(OUTPUTS / "tabel_distribusi_risiko.csv", index=False)

# tabel_statistik_anomaly_score.csv
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

# tabel_threshold_anomali.csv
df_thresh = pd.DataFrame([
    {"kategori": "rendah", "kondisi": f"< P{P_SEDANG}",          "threshold": threshold_p90},
    {"kategori": "sedang", "kondisi": f"P{P_SEDANG} ≤ x < P{P_TINGGI}", "threshold": threshold_p95},
    {"kategori": "tinggi", "kondisi": f"≥ P{P_TINGGI}",          "threshold": threshold_p95},
])
df_thresh.to_csv(OUTPUTS / "tabel_threshold_anomali.csv", index=False)

# tabel_evaluasi_surrogate.csv (fidelity)
df_fidelity = pd.DataFrame([
    {"split": "train", "r2": train_metrics["r2"], "rmse": train_metrics["rmse"], "mae": train_metrics["mae"]},
    {"split": "test",  "r2": test_metrics["r2"],  "rmse": test_metrics["rmse"],  "mae": test_metrics["mae"]},
])
df_fidelity.to_csv(OUTPUTS / "tabel_evaluasi_surrogate.csv", index=False)

# tabel_mccv.csv (stabilitas per run)
df_mccv = pd.DataFrame({
    "run"      : list(range(1, MCCV_RUNS + 1)),
    "spearman" : spearman_runs,
    "r2"       : r2_runs,
    "shap_top5": ["|".join(sorted(s)) for s in shap_top5_runs],
})
df_mccv.to_csv(OUTPUTS / "tabel_mccv.csv", index=False)

# development_summary.json
summary = {
    "dataset": {
        "n_rows"              : int(df_raw.shape[0]),
        "n_features_original" : int(df_raw.shape[1]),
        "n_features_encoded"  : int(X_all.shape[1]),
        "dropped_columns"     : BUANG_KONSTAN + BUANG_IDENTIFIER + BUANG_OUTCOME,
        "categorical_columns" : CAT_COLS,
    },
    "isolation_forest": {
        "n_estimators"  : IF_PARAMS["n_estimators"],
        "max_samples"   : max_samples,
        "contamination" : "auto",
        "max_features"  : IF_PARAMS["max_features"],
        "bootstrap"     : IF_PARAMS["bootstrap"],
        "score_range"   : [float(anomaly_score_if.min()), float(anomaly_score_if.max())],
        "risk_distribution": {"rendah": n_rendah, "sedang": n_sedang, "tinggi": n_tinggi},
        "thresholds"    : {"p90": threshold_p90, "p95": threshold_p95},
    },
    "xgboost_surrogate": {
        "hyperparameters": xgb_best_params,
        "fidelity_train" : train_metrics,
        "fidelity_test"  : test_metrics,
        "criteria_met"   : {"r2": bool(r2_ok), "rmse": bool(rmse_ok), "mae": bool(mae_ok)},
    },
    "mccv": {
        "n_runs"            : MCCV_RUNS,
        "test_size"         : MCCV_TEST,
        "median_spearman"   : median_spearman,
        "std_r2"            : std_r2,
        "mean_shap_overlap" : mean_shap_overlap,
        "spearman_ok"       : bool(spearman_ok),
        "r2_std_ok"         : bool(r2_std_ok),
        "shap_overlap_ok"   : bool(shap_overlap_ok),
        "stability_ok"      : bool(stability_ok),
        "spearman_runs"     : spearman_runs,
        "r2_runs"           : r2_runs,
    },
    "shap": {
        "top5_global": df_global.head(5)[["feature","mean_abs_shap"]].to_dict(orient="records"),
        "n_local_entries": len(df_local),
    },
}

with open(OUTPUTS / "development_summary.json", "w") as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)

print("\n  Semua file berhasil disimpan:")
for p in sorted(OUTPUTS.iterdir()):
    size = p.stat().st_size
    unit = "KB" if size > 1024 else "B"
    val  = size // 1024 if size > 1024 else size
    print(f"    {p.name:45s} {val:6} {unit}")

print("\n" + "="*65)
print("  SELESAI — Pipeline sesuai metodologi skripsi Bab III")
print("="*65)
print(f"\n  IF Score   → mean={anomaly_score_if.mean():.4f} | "
      f"P90={threshold_p90:.4f} | P95={threshold_p95:.4f}")
print(f"  Surrogate  → R²={test_metrics['r2']:.4f} | "
      f"RMSE={test_metrics['rmse']:.6f} | MAE={test_metrics['mae']:.6f}")
print(f"  MCCV       → median Spearman={median_spearman:.4f} | std R²={std_r2:.4f} | overlap SHAP={mean_shap_overlap:.4f}  {'✅ stabil' if stability_ok else '⚠️ kurang stabil'}")
print(f"  Risiko     → Rendah:{n_rendah} | Sedang:{n_sedang} | Tinggi:{n_tinggi}\n")
