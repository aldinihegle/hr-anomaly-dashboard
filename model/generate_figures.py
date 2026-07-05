"""
generate_figures.py — Pembuat Gambar untuk Bab 4 Skripsi
=========================================================
Membaca output yang sudah ada (CSV + joblib) dari development_ml.py
dan menghasilkan semua visualisasi yang dibutuhkan untuk Bab 4.

Gambar yang dihasilkan (outputs/figures/):
  01_distribusi_anomaly_score.png     — Histogram skor IF + KDE + threshold
  02_boxplot_risiko.png               — Boxplot skor per kategori risiko
  03_pie_proporsi_risiko.png          — Pie chart proporsi risiko
  04_surrogate_actual_vs_predicted.png — Fidelity scatter IF vs XGBoost
  05_distribusi_residual_surrogate.png — Histogram residual surrogate
  06_mccv_stability.png               — Line plot Spearman per run MCCV
  07_shap_bar_global.png              — Bar chart global SHAP top-15
  08_shap_beeswarm.png                — SHAP beeswarm top-15 fitur
  09_feature_dist_by_risk.png         — Distribusi 6 fitur kunci per risiko
  10_heatmap_correlation.png          — Heatmap korelasi fitur numerik
  11_top_anomalies_profile.png        — Radar/profil top-10 karyawan anomali
  12_shap_waterfall_top3.png          — Waterfall SHAP 3 karyawan teranomalus

Jalankan:
    python generate_figures.py
"""

from __future__ import annotations

import warnings
from pathlib import Path

import joblib
import matplotlib
import matplotlib.patches as mpatches
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import shap

warnings.filterwarnings("ignore")
matplotlib.use("Agg")

# ─────────────────────────────────────────────────────────────────────────────
# 0. KONFIGURASI PATH
# ─────────────────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).parent
OUTPUTS  = BASE_DIR / "outputs"
FIG_DIR  = OUTPUTS / "figures"
FIG_DIR.mkdir(parents=True, exist_ok=True)

DATASET  = BASE_DIR.parent / "dataset" / "WA_Fn-UseC_-HR-Employee-Attrition.csv"

# Tema visual konsisten
PALETTE = {"rendah": "#2ecc71", "sedang": "#f39c12", "tinggi": "#e74c3c"}
ORDER   = ["rendah", "sedang", "tinggi"]

sns.set_theme(style="whitegrid", font_scale=1.05)
plt.rcParams.update({
    "figure.dpi": 150,
    "savefig.dpi": 200,
    "savefig.bbox": "tight",
    "font.family": "DejaVu Sans",
})

DPI = 200

print("\n" + "="*65)
print("  GENERATE FIGURES — Bab 4 Skripsi")
print("="*65)

# ─────────────────────────────────────────────────────────────────────────────
# 1. MUAT DATA
# ─────────────────────────────────────────────────────────────────────────────

df = pd.read_csv(OUTPUTS / "anomaly_scoring_results.csv")
df_shap_global = pd.read_csv(OUTPUTS / "shap_global_importance.csv")
df_shap_local  = pd.read_csv(OUTPUTS / "shap_local_all.csv")
df_mccv        = pd.read_csv(OUTPUTS / "tabel_mccv.csv")
df_fidelity    = pd.read_csv(OUTPUTS / "tabel_evaluasi_surrogate.csv")
df_thresh      = pd.read_csv(OUTPUTS / "tabel_threshold_anomali.csv")

scores         = df["anomaly_score_if"].values
risk_cat       = df["risk_category"].values

# Threshold — tabel menyimpan P90 di baris kategori "sedang" dan P95 di baris "tinggi"
# Kolom: kategori | kondisi | threshold
df_thresh_sedang = df_thresh[df_thresh["kategori"] == "sedang"]
df_thresh_tinggi = df_thresh[df_thresh["kategori"] == "tinggi"]
threshold_p90 = df_thresh_sedang["threshold"].values[0]
threshold_p95 = df_thresh_tinggi["threshold"].values[0]
# Jika P90 == P95 (edge case), hitung ulang dari data
if abs(threshold_p90 - threshold_p95) < 1e-9:
    threshold_p90 = float(np.percentile(scores, 90))
    threshold_p95 = float(np.percentile(scores, 95))

# Load model artifacts
if_model  = joblib.load(OUTPUTS / "isolation_forest_model.joblib")
surrogate = joblib.load(OUTPUTS / "xgboost_surrogate_pipeline.joblib")
encoder   = joblib.load(OUTPUTS / "encoder.joblib")
scaler    = joblib.load(OUTPUTS / "scaler.joblib")

# Rekonstruksi fitur yang diproses
df_raw = pd.read_csv(DATASET)
BUANG  = ["EmployeeCount", "Over18", "StandardHours", "EmployeeNumber", "Attrition"]
df_feat = df_raw.drop(columns=BUANG, errors="ignore")
CAT_COLS = df_feat.select_dtypes(include="object").columns.tolist()
NUM_COLS = df_feat.select_dtypes(include=np.number).columns.tolist()

X_cat    = encoder.transform(df_feat[CAT_COLS])
X_num    = scaler.transform(df_feat[NUM_COLS].values)
X_all    = np.hstack([X_num, X_cat])

cat_names = encoder.get_feature_names_out(CAT_COLS).tolist()
all_feat_names = NUM_COLS + cat_names

# SHAP explainer
xgb_model = surrogate.named_steps["model"]
explainer  = shap.TreeExplainer(xgb_model)
shap_vals  = explainer.shap_values(X_all)   # (1470, n_features)

# Surrogate predictions — pipeline hanya punya step "model", beri X langsung
y_true_all = scores
y_pred_all = xgb_model.predict(X_all)

# Split sederhana untuk plot (sama seed seperti development_ml.py)
from sklearn.model_selection import train_test_split
idx_all = np.arange(len(X_all))
_, idx_te = train_test_split(idx_all, test_size=0.20, random_state=42)
X_te      = X_all[idx_te]
y_true_te = y_true_all[idx_te]
y_pred_te = xgb_model.predict(X_te)

print(f"Data dimuat: {len(df)} karyawan | "
      f"P90={threshold_p90:.4f} | P95={threshold_p95:.4f}")


# ─────────────────────────────────────────────────────────────────────────────
# GAMBAR 1 — Distribusi Anomaly Score (Histogram + KDE + Threshold)
# ─────────────────────────────────────────────────────────────────────────────
print("\n[01] Distribusi Anomaly Score…")

fig, ax = plt.subplots(figsize=(10, 5))
# Warna bar sesuai risiko
n_bins = 40
counts, bin_edges, patches = ax.hist(scores, bins=n_bins, alpha=0.0)  # invisible, hanya untuk bin info

# Histplot dengan KDE
sns.histplot(scores, bins=n_bins, kde=True, color="#3498db", ax=ax, stat="count")

# Warnai tiap bar
for patch in ax.patches:
    mid = (patch.get_x() + patch.get_x() + patch.get_width()) / 2
    if mid >= threshold_p95:
        patch.set_facecolor(PALETTE["tinggi"])
        patch.set_alpha(0.85)
    elif mid >= threshold_p90:
        patch.set_facecolor(PALETTE["sedang"])
        patch.set_alpha(0.85)
    else:
        patch.set_facecolor(PALETTE["rendah"])
        patch.set_alpha(0.75)

ax.axvline(threshold_p90, color="#e67e22", linestyle="--", linewidth=1.8,
           label=f"P90 = {threshold_p90:.4f} (threshold sedang)")
ax.axvline(threshold_p95, color="#c0392b", linestyle="--", linewidth=1.8,
           label=f"P95 = {threshold_p95:.4f} (threshold tinggi)")

n_r = int((risk_cat == "rendah").sum())
n_s = int((risk_cat == "sedang").sum())
n_t = int((risk_cat == "tinggi").sum())

legend_patches = [
    mpatches.Patch(color=PALETTE["rendah"], label=f"Rendah (n={n_r})"),
    mpatches.Patch(color=PALETTE["sedang"], label=f"Sedang (n={n_s})"),
    mpatches.Patch(color=PALETTE["tinggi"], label=f"Tinggi (n={n_t})"),
]
ax.legend(handles=legend_patches + ax.lines[:2], fontsize=9)
ax.set_title("Distribusi Anomaly Score Isolation Forest", fontsize=13, fontweight="bold")
ax.set_xlabel("Anomaly Score (dinormalisasi ke [0,1])")
ax.set_ylabel("Jumlah Karyawan")
fig.tight_layout()
fig.savefig(FIG_DIR / "01_distribusi_anomaly_score.png", dpi=DPI)
plt.close(fig)
print("   ✅ Selesai")


# ─────────────────────────────────────────────────────────────────────────────
# GAMBAR 2 — Boxplot Anomaly Score per Kategori Risiko
# ─────────────────────────────────────────────────────────────────────────────
print("[02] Boxplot Risiko…")

fig, ax = plt.subplots(figsize=(8, 5))
df_plot = pd.DataFrame({"anomaly_score": scores, "Kategori Risiko": risk_cat})

sns.boxplot(
    data=df_plot, x="Kategori Risiko", y="anomaly_score",
    order=ORDER, palette=PALETTE, width=0.5,
    flierprops={"marker": "o", "markersize": 3, "alpha": 0.5},
    ax=ax,
)
sns.stripplot(
    data=df_plot, x="Kategori Risiko", y="anomaly_score",
    order=ORDER, palette=PALETTE, size=2, alpha=0.3, jitter=True, ax=ax,
)

ax.set_title("Distribusi Anomaly Score per Kategori Risiko", fontsize=13, fontweight="bold")
ax.set_xlabel("Kategori Risiko")
ax.set_ylabel("Anomaly Score")
for cat, col in PALETTE.items():
    subset = scores[risk_cat == cat]
    ax.text(ORDER.index(cat), subset.max() + 0.01,
            f"n={len(subset)}", ha="center", fontsize=9, color=col)
fig.tight_layout()
fig.savefig(FIG_DIR / "02_boxplot_risiko.png", dpi=DPI)
plt.close(fig)
print("   ✅ Selesai")


# ─────────────────────────────────────────────────────────────────────────────
# GAMBAR 3 — Pie Chart Proporsi Risiko
# ─────────────────────────────────────────────────────────────────────────────
print("[03] Pie proporsi risiko…")

fig, ax = plt.subplots(figsize=(7, 6))
sizes  = [n_r, n_s, n_t]
colors = [PALETTE["rendah"], PALETTE["sedang"], PALETTE["tinggi"]]
labels = [f"Rendah\n{n_r} ({n_r/len(scores)*100:.1f}%)",
          f"Sedang\n{n_s} ({n_s/len(scores)*100:.1f}%)",
          f"Tinggi\n{n_t} ({n_t/len(scores)*100:.1f}%)"]
explode = (0, 0.05, 0.1)
wedges, texts = ax.pie(sizes, colors=colors, labels=labels,
                        explode=explode, startangle=90,
                        textprops={"fontsize": 10})
for w in wedges:
    w.set_edgecolor("white")
    w.set_linewidth(2)
ax.set_title("Proporsi Kategori Risiko Anomali Karyawan",
             fontsize=13, fontweight="bold", pad=15)
fig.tight_layout()
fig.savefig(FIG_DIR / "03_pie_proporsi_risiko.png", dpi=DPI)
plt.close(fig)
print("   ✅ Selesai")


# ─────────────────────────────────────────────────────────────────────────────
# GAMBAR 4 — Surrogate: Actual vs Predicted (Fidelity)
# ─────────────────────────────────────────────────────────────────────────────
print("[04] Surrogate Actual vs Predicted…")

test_r2 = df_fidelity.loc[df_fidelity["split"] == "test", "r2"].values[0]

fig, ax = plt.subplots(figsize=(7, 6))
ax.scatter(y_true_te, y_pred_te, alpha=0.45, s=20,
           c="#3498db", edgecolors="none", label="Data test")
lims = [min(y_true_te.min(), y_pred_te.min()) - 0.02,
        max(y_true_te.max(), y_pred_te.max()) + 0.02]
ax.plot(lims, lims, "k--", linewidth=1.2, label="Ideal (y = x)")
ax.set_xlim(lims); ax.set_ylim(lims)
ax.set_xlabel("Anomaly Score (Isolation Forest — Aktual)")
ax.set_ylabel("Predicted Score (XGBoost Surrogate)")
ax.set_title("Fidelitas Surrogate Model: Aktual vs Prediksi",
             fontsize=13, fontweight="bold")
ax.text(0.05, 0.92, f"R² (test) = {test_r2:.4f}",
        transform=ax.transAxes, fontsize=11, color="#2c3e50",
        bbox=dict(boxstyle="round,pad=0.3", fc="white", ec="#bdc3c7"))
ax.legend(fontsize=9)
fig.tight_layout()
fig.savefig(FIG_DIR / "04_surrogate_actual_vs_predicted.png", dpi=DPI)
plt.close(fig)
print("   ✅ Selesai")


# ─────────────────────────────────────────────────────────────────────────────
# GAMBAR 5 — Distribusi Residual Surrogate
# ─────────────────────────────────────────────────────────────────────────────
print("[05] Distribusi Residual Surrogate…")

residuals = y_true_te - y_pred_te

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Histogram residual
sns.histplot(residuals, bins=30, kde=True, color="#9b59b6", ax=axes[0])
axes[0].axvline(0, color="red", linestyle="--", linewidth=1.5)
axes[0].axvline(residuals.mean(), color="orange", linestyle="-.", linewidth=1.5,
                label=f"Mean = {residuals.mean():.4f}")
axes[0].set_title("Distribusi Residual Surrogate")
axes[0].set_xlabel("Residual (Aktual − Prediksi)")
axes[0].set_ylabel("Frekuensi")
axes[0].legend(fontsize=9)

# Residual vs Predicted (cek heteroskedastisitas)
axes[1].scatter(y_pred_te, residuals, alpha=0.4, s=20,
                c="#e74c3c", edgecolors="none")
axes[1].axhline(0, color="black", linestyle="--", linewidth=1.2)
axes[1].set_xlabel("Predicted Score (XGBoost Surrogate)")
axes[1].set_ylabel("Residual")
axes[1].set_title("Residual vs Prediksi (Homoskedastisitas)")

fig.suptitle("Analisis Residual Surrogate Model XGBoost",
             fontsize=13, fontweight="bold", y=1.02)
fig.tight_layout()
fig.savefig(FIG_DIR / "05_distribusi_residual_surrogate.png", dpi=DPI)
plt.close(fig)
print("   ✅ Selesai")


# ─────────────────────────────────────────────────────────────────────────────
# GAMBAR 6 — MCCV Stability (Spearman per Run)
# ─────────────────────────────────────────────────────────────────────────────
print("[06] MCCV Stability…")

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Spearman per run
axes[0].plot(df_mccv["run"], df_mccv["spearman"], "o-",
             color="#3498db", linewidth=2, markersize=7, label="Spearman")
axes[0].axhline(df_mccv["spearman"].median(), color="orange", linestyle="--",
                linewidth=1.5, label=f"Median = {df_mccv['spearman'].median():.4f}")
axes[0].axhline(0.80, color="red", linestyle=":", linewidth=1.2, label="Batas min (0.80)")
axes[0].set_xlabel("Run MCCV ke-")
axes[0].set_ylabel("Spearman Correlation")
axes[0].set_title("Stabilitas MCCV — Spearman per Run")
axes[0].set_ylim(0.7, 1.0)
axes[0].legend(fontsize=9)
axes[0].set_xticks(df_mccv["run"])

# R² per run
axes[1].plot(df_mccv["run"], df_mccv["r2"], "s-",
             color="#2ecc71", linewidth=2, markersize=7, label="R²")
axes[1].axhline(df_mccv["r2"].median(), color="orange", linestyle="--",
                linewidth=1.5, label=f"Median = {df_mccv['r2'].median():.4f}")
axes[1].axhline(0.80, color="red", linestyle=":", linewidth=1.2, label="Batas min (0.80)")
axes[1].set_xlabel("Run MCCV ke-")
axes[1].set_ylabel("R²")
axes[1].set_title("Stabilitas MCCV — R² per Run")
axes[1].set_ylim(0.7, 1.0)
axes[1].legend(fontsize=9)
axes[1].set_xticks(df_mccv["run"])

fig.suptitle("Monte Carlo Cross-Validation (MCCV) — Stabilitas Surrogate",
             fontsize=13, fontweight="bold", y=1.02)
fig.tight_layout()
fig.savefig(FIG_DIR / "06_mccv_stability.png", dpi=DPI)
plt.close(fig)
print("   ✅ Selesai")


# ─────────────────────────────────────────────────────────────────────────────
# GAMBAR 7 — SHAP Global Bar Chart (Top 15)
# ─────────────────────────────────────────────────────────────────────────────
print("[07] SHAP Bar Global…")

top15 = df_shap_global.head(15).iloc[::-1].copy()
top15["feature_clean"] = (
    top15["feature"]
    .str.replace("x0_", "BusinessTravel: ", regex=False)
    .str.replace("x1_", "Department: ", regex=False)
    .str.replace("x2_", "EducationField: ", regex=False)
    .str.replace("x3_", "Gender: ", regex=False)
    .str.replace("x4_", "JobRole: ", regex=False)
    .str.replace("x5_", "MaritalStatus: ", regex=False)
    .str.replace("x6_", "OverTime: ", regex=False)
)

fig, ax = plt.subplots(figsize=(10, 6))
bars = ax.barh(top15["feature_clean"], top15["mean_abs_shap"],
               color="#17becf", edgecolor="white", height=0.7)
for bar, val in zip(bars, top15["mean_abs_shap"]):
    ax.text(val + 0.0003, bar.get_y() + bar.get_height()/2,
            f"{val:.4f}", va="center", fontsize=8.5, color="#2c3e50")
ax.set_xlabel("Mean |SHAP Value|", fontsize=11)
ax.set_title("Global SHAP Feature Importance — Top 15 Fitur",
             fontsize=13, fontweight="bold")
ax.set_xlim(0, top15["mean_abs_shap"].max() * 1.15)
ax.grid(axis="x", alpha=0.4)
fig.tight_layout()
fig.savefig(FIG_DIR / "07_shap_bar_global.png", dpi=DPI)
plt.close(fig)
print("   ✅ Selesai")


# ─────────────────────────────────────────────────────────────────────────────
# GAMBAR 8 — SHAP Beeswarm (Top 15)
# ─────────────────────────────────────────────────────────────────────────────
print("[08] SHAP Beeswarm…")

top15_feat_names = df_shap_global.head(15)["feature"].tolist()
top15_idx  = [all_feat_names.index(f) for f in top15_feat_names if f in all_feat_names]
X_all_df   = pd.DataFrame(X_all, columns=all_feat_names)

shap.summary_plot(
    shap_vals[:, top15_idx],
    X_all_df.iloc[:, top15_idx],
    feature_names=top15_feat_names,
    plot_type="dot",
    show=False,
    max_display=15,
    color_bar=True,
    alpha=0.6,
)
plt.title("SHAP Beeswarm — Distribusi SHAP Value Top 15 Fitur",
          fontsize=12, fontweight="bold")
plt.tight_layout()
plt.savefig(FIG_DIR / "08_shap_beeswarm.png", dpi=DPI, bbox_inches="tight")
plt.close("all")
print("   ✅ Selesai")


# ─────────────────────────────────────────────────────────────────────────────
# GAMBAR 9 — Distribusi Fitur Kunci per Kategori Risiko
# ─────────────────────────────────────────────────────────────────────────────
print("[09] Distribusi Fitur Kunci per Risiko…")

key_features = [
    ("MonthlyIncome",       "Monthly Income ($)"),
    ("Age",                 "Usia (tahun)"),
    ("TotalWorkingYears",   "Total Working Years"),
    ("YearsAtCompany",      "Years at Company"),
    ("DistanceFromHome",    "Distance From Home"),
    ("PercentSalaryHike",   "Percent Salary Hike (%)"),
]

df_plot9 = df.copy()
df_plot9["Kategori Risiko"] = risk_cat

fig, axes = plt.subplots(2, 3, figsize=(14, 9))
for ax, (col, label) in zip(axes.flat, key_features):
    for cat in ORDER:
        subset = df_plot9.loc[df_plot9["Kategori Risiko"] == cat, col]
        sns.kdeplot(subset, ax=ax, label=cat, color=PALETTE[cat],
                    fill=True, alpha=0.25, linewidth=1.8)
    ax.set_title(label, fontsize=10, fontweight="bold")
    ax.set_xlabel("")
    ax.set_ylabel("Densitas")
    ax.legend(title="Risiko", fontsize=8, title_fontsize=8)

fig.suptitle("Distribusi Fitur Kunci per Kategori Risiko Anomali",
             fontsize=13, fontweight="bold", y=1.01)
fig.tight_layout()
fig.savefig(FIG_DIR / "09_feature_dist_by_risk.png", dpi=DPI)
plt.close(fig)
print("   ✅ Selesai")


# ─────────────────────────────────────────────────────────────────────────────
# GAMBAR 10 — Heatmap Korelasi Fitur Numerik
# ─────────────────────────────────────────────────────────────────────────────
print("[10] Heatmap Korelasi…")

num_cols_sel = [
    "Age", "MonthlyIncome", "TotalWorkingYears", "YearsAtCompany",
    "YearsInCurrentRole", "YearsSinceLastPromotion", "YearsWithCurrManager",
    "DistanceFromHome", "PercentSalaryHike", "NumCompaniesWorked",
    "JobLevel", "StockOptionLevel", "anomaly_score_if",
]
corr_df = df[num_cols_sel].rename(columns={"anomaly_score_if": "IF Score"}).corr()

fig, ax = plt.subplots(figsize=(11, 9))
mask = np.triu(np.ones_like(corr_df, dtype=bool))
sns.heatmap(corr_df, mask=mask, annot=True, fmt=".2f", cmap="RdYlGn",
            center=0, vmin=-1, vmax=1, linewidths=0.5,
            annot_kws={"size": 8}, ax=ax, square=True,
            cbar_kws={"shrink": 0.8})
ax.set_title("Heatmap Korelasi Fitur Numerik & Anomaly Score",
             fontsize=13, fontweight="bold", pad=15)
ax.tick_params(axis="x", rotation=45)
ax.tick_params(axis="y", rotation=0)
fig.tight_layout()
fig.savefig(FIG_DIR / "10_heatmap_correlation.png", dpi=DPI)
plt.close(fig)
print("   ✅ Selesai")


# ─────────────────────────────────────────────────────────────────────────────
# GAMBAR 11 — Profil Karakteristik Kategori Risiko (Bar + Mean comparison)
# ─────────────────────────────────────────────────────────────────────────────
print("[11] Profil Rata-Rata per Risiko…")

profile_cols = {
    "Age": "Usia",
    "MonthlyIncome": "Monthly Income ($)",
    "TotalWorkingYears": "Total Working Yrs",
    "YearsAtCompany": "Years at Company",
    "PercentSalaryHike": "Salary Hike (%)",
    "DistanceFromHome": "Distance Home",
}

df_profile = (
    df.assign(risk=risk_cat)
      .groupby("risk")[list(profile_cols.keys())]
      .mean()
      .reindex(ORDER)
)

# Normalisasi 0-1 per kolom untuk radar-style grouped bar
df_norm = (df_profile - df_profile.min()) / (df_profile.max() - df_profile.min() + 1e-9)

fig, axes = plt.subplots(1, 2, figsize=(14, 6))

# Kiri: Grouped bar — nilai asli (normalized for comparison)
x = np.arange(len(profile_cols))
width = 0.25
for i, cat in enumerate(ORDER):
    vals = df_norm.loc[cat].values
    bars = axes[0].bar(x + i*width, vals, width, label=cat,
                       color=PALETTE[cat], alpha=0.85, edgecolor="white")
axes[0].set_xticks(x + width)
axes[0].set_xticklabels([profile_cols[c] for c in profile_cols],
                          rotation=30, ha="right", fontsize=9)
axes[0].set_ylabel("Nilai Ternormalisasi (0–1)")
axes[0].set_title("Profil Rata-rata Fitur per Kategori Risiko\n(Ternormalisasi)")
axes[0].legend(title="Kategori Risiko", fontsize=9)
axes[0].set_ylim(0, 1.15)

# Kanan: Tabel nilai asli
df_display = df_profile.copy()
df_display.columns = [profile_cols[c] for c in profile_cols]
cell_text = [[f"{df_display.loc[r, c]:,.1f}" for c in df_display.columns]
             for r in ORDER]
table = axes[1].table(
    cellText=cell_text,
    rowLabels=["Rendah", "Sedang", "Tinggi"],
    colLabels=[profile_cols[c] for c in profile_cols],
    cellLoc="center", loc="center",
)
table.auto_set_font_size(False)
table.set_fontsize(9)
table.scale(1.2, 1.8)
for (row, col), cell in table.get_celld().items():
    if row == 0:
        cell.set_facecolor("#dfe6e9")
        cell.set_text_props(fontweight="bold")
    elif col == -1:
        risk_name = ORDER[row - 1]
        cell.set_facecolor(PALETTE[risk_name])
        cell.set_text_props(color="white", fontweight="bold")
axes[1].axis("off")
axes[1].set_title("Nilai Rata-rata Aktual", fontsize=11, fontweight="bold")

fig.suptitle("Perbandingan Profil Karyawan per Kategori Risiko",
             fontsize=13, fontweight="bold", y=1.02)
fig.tight_layout()
fig.savefig(FIG_DIR / "11_profil_risiko_comparison.png", dpi=DPI)
plt.close(fig)
print("   ✅ Selesai")


# ─────────────────────────────────────────────────────────────────────────────
# GAMBAR 12 — SHAP Waterfall Plot Top-3 Karyawan Teranomalus
# ─────────────────────────────────────────────────────────────────────────────
print("[12] SHAP Waterfall Top-3 Karyawan…")

top3_idx = np.argsort(scores)[::-1][:3]

fig, axes = plt.subplots(1, 3, figsize=(18, 6))

for ax_i, emp_idx in enumerate(top3_idx):
    emp_score = scores[emp_idx]
    emp_risk  = risk_cat[emp_idx]

    # Ambil top-10 SHAP fitur dari df_shap_local
    emp_shap = (
        df_shap_local[df_shap_local["employee_idx"] == emp_idx]
        .assign(abs_shap=lambda x: x["shap_value"].abs())
        .nlargest(10, "abs_shap")
        .sort_values("shap_value")
    )

    colors_bar = [PALETTE["tinggi"] if v > 0 else PALETTE["rendah"]
                  for v in emp_shap["shap_value"]]
                  
    # Clean feature labels
    def clean_label(feat):
        feat = feat.replace("Department_", "Dept: ")
        feat = feat.replace("BusinessTravel_", "Travel: ")
        feat = feat.replace("EducationField_", "Edu: ")
        feat = feat.replace("JobRole_", "Role: ")
        feat = feat.replace("_Yes", " (Yes)")
        feat = feat.replace("_", " ")
        if len(feat) > 25:
            return feat[:22] + "..."
        return feat
        
    clean_features = emp_shap["feature"].apply(clean_label)

    axes[ax_i].barh(clean_features, emp_shap["shap_value"],
                    color=colors_bar, edgecolor="white", height=0.7)
    axes[ax_i].axvline(0, color="black", linewidth=0.8)
    axes[ax_i].set_title(
        f"Karyawan #{emp_idx + 1}\nScore={emp_score:.4f} | Risiko: {emp_risk.upper()}",
        fontsize=10, fontweight="bold"
    )
    axes[ax_i].set_xlabel("SHAP Value", fontsize=9)
    if ax_i == 0:
        axes[ax_i].set_ylabel("Fitur", fontsize=9)

# Legend
pos_patch = mpatches.Patch(color=PALETTE["tinggi"], label="Mendorong skor lebih tinggi")
neg_patch = mpatches.Patch(color=PALETTE["rendah"], label="Menekan skor lebih rendah")
fig.legend(handles=[pos_patch, neg_patch], loc="lower center",
           ncol=2, fontsize=10, bbox_to_anchor=(0.5, -0.02))

fig.suptitle("Local SHAP — Faktor Penyebab Anomali pada 3 Karyawan Paling Anomalus",
             fontsize=13, fontweight="bold", y=1.02)
fig.tight_layout()
fig.savefig(FIG_DIR / "12_shap_waterfall_top3.png", dpi=DPI, bbox_inches="tight")
plt.close(fig)
print("   ✅ Selesai")


# ─────────────────────────────────────────────────────────────────────────────
# GAMBAR 13 — Categorical Features per Risiko (Stacked Bar)
# ─────────────────────────────────────────────────────────────────────────────
print("[13] Categorical Features per Risiko…")

cat_features_plot = [
    ("OverTime", "OverTime"),
    ("Department", "Department"),
    ("BusinessTravel", "Business Travel"),
    ("MaritalStatus", "Status Pernikahan"),
]

fig, axes = plt.subplots(1, 4, figsize=(16, 5))

for ax, (col, label) in zip(axes, cat_features_plot):
    ct = pd.crosstab(df[col], risk_cat, normalize="index") * 100
    ct = ct.reindex(columns=ORDER, fill_value=0)
    ct.plot(kind="bar", stacked=True, color=[PALETTE[c] for c in ORDER],
            ax=ax, width=0.7, edgecolor="white")
    ax.set_title(label, fontsize=11, fontweight="bold")
    ax.set_xlabel("")
    ax.set_ylabel("% Karyawan per Kategori" if ax == axes[0] else "")
    ax.tick_params(axis="x", rotation=30)
    ax.legend(title="Risiko", fontsize=8, title_fontsize=8)
    ax.set_ylim(0, 110)

fig.suptitle("Distribusi Kategori Risiko per Variabel Kategorikal",
             fontsize=13, fontweight="bold", y=1.02)
fig.tight_layout()
fig.savefig(FIG_DIR / "13_categorical_by_risk.png", dpi=DPI)
plt.close(fig)
print("   ✅ Selesai")


# ─────────────────────────────────────────────────────────────────────────────
# GAMBAR 14 — Scatter: Age vs MonthlyIncome, warna = kategori risiko
# ─────────────────────────────────────────────────────────────────────────────
print("[14] Scatter Age vs Income…")

fig, ax = plt.subplots(figsize=(9, 6))
for cat in ORDER:
    mask = risk_cat == cat
    ax.scatter(df.loc[mask, "Age"], df.loc[mask, "MonthlyIncome"],
               c=PALETTE[cat], label=cat, alpha=0.6, s=25, edgecolors="none")
ax.set_xlabel("Usia (tahun)", fontsize=11)
ax.set_ylabel("Monthly Income ($)", fontsize=11)
ax.set_title("Distribusi Karyawan: Usia vs Monthly Income\n(Warna = Kategori Risiko)",
             fontsize=13, fontweight="bold")
ax.legend(title="Kategori Risiko", fontsize=10)
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f"${x:,.0f}"))
fig.tight_layout()
fig.savefig(FIG_DIR / "14_scatter_age_vs_income.png", dpi=DPI)
plt.close(fig)
print("   ✅ Selesai")


# ─────────────────────────────────────────────────────────────────────────────
# RINGKASAN
# ─────────────────────────────────────────────────────────────────────────────

print("\n" + "="*65)
print("  SELESAI — Semua gambar tersimpan di:")
print(f"  {FIG_DIR}")
print("="*65)

figs = sorted(FIG_DIR.glob("*.png"))
for f in figs:
    size_kb = f.stat().st_size // 1024
    print(f"  {f.name:55s} {size_kb:5} KB")

print(f"\nTotal: {len(figs)} gambar dihasilkan.\n")
