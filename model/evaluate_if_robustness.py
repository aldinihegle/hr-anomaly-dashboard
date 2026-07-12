"""
evaluate_if_robustness.py — Evaluasi Robustness Isolation Forest
=================================================================
Eksperimen A: Stabilitas Random Seed (30 run)
Eksperimen B: Sensitivitas Parameter (one-factor-at-a-time)

Menghasilkan:
  - 5 file CSV ringkasan metrik
  - 5 file PNG visualisasi grayscale

Referensi metodologis:
  - Campos dkk. (2016): evaluasi unsupervised tanpa ground truth
  - Sun dkk. (2025): Jaccard Top-K untuk stabilitas anomaly detection
  - Albu dkk. (2026): kombinasi random seed + Spearman + Jaccard
  - Nogueira dkk. (2018): stabilitas subset terpilih
"""

from __future__ import annotations

import json
import logging
import time
import warnings
from dataclasses import dataclass, replace
from itertools import combinations
from pathlib import Path
from typing import Any

import joblib
import matplotlib.patches as mpatches
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy.stats import spearmanr
from sklearn.ensemble import IsolationForest
from sklearn.metrics import cohen_kappa_score

warnings.filterwarnings("ignore")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# ─────────────────────────────────────────────────────────────────────────────
# 0. KONFIGURASI
# ─────────────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
CACHE_DIR = BASE_DIR / ".cache"
OUTPUTS = BASE_DIR / "outputs"
FIG_DIR = OUTPUTS / "figures"
OUTPUTS.mkdir(exist_ok=True)
FIG_DIR.mkdir(exist_ok=True)

DPI = 200

# Grayscale palette (konsisten dengan generate_figures.py)
GRAY_DARK = "#333333"
GRAY_MED = "#777777"
GRAY_LIGHT = "#BBBBBB"

plt.rcParams.update({
    "font.family": "sans-serif",
    "font.size": 10,
    "axes.edgecolor": GRAY_DARK,
    "axes.labelcolor": GRAY_DARK,
    "xtick.color": GRAY_DARK,
    "ytick.color": GRAY_DARK,
    "text.color": GRAY_DARK,
    "figure.facecolor": "white",
    "axes.facecolor": "white",
    "axes.grid": True,
    "grid.alpha": 0.3,
    "grid.color": GRAY_LIGHT,
})


@dataclass(frozen=True)
class IFConfig:
    n_estimators: int = 200
    max_samples: int | str = 256
    contamination: str | float = "auto"
    max_features: float = 1.0
    bootstrap: bool = False
    n_jobs: int = -1


BASELINE_CONFIG = IFConfig()
BASELINE_SEED = 42
N_SEEDS_STABILITY = 30
N_SEEDS_PARAM = 10


# ─────────────────────────────────────────────────────────────────────────────
# 1. HELPER FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

def fit_if_scores(X: np.ndarray, config: IFConfig, random_state: int) -> np.ndarray:
    """Fit IF and return raw anomaly scores (higher = more anomalous)."""
    ms = config.max_samples
    if isinstance(ms, int):
        ms = min(ms, X.shape[0])

    model = IsolationForest(
        n_estimators=config.n_estimators,
        max_samples=ms,
        contamination=config.contamination,
        max_features=config.max_features,
        bootstrap=config.bootstrap,
        random_state=random_state,
        n_jobs=config.n_jobs,
    )
    model.fit(X)
    return -model.score_samples(X)


def categorize_relative(scores: np.ndarray) -> tuple[np.ndarray, float, float]:
    """Assign risk categories using per-run P90/P95."""
    p90 = float(np.quantile(scores, 0.90))
    p95 = float(np.quantile(scores, 0.95))
    cats = np.where(scores >= p95, "Tinggi",
                    np.where(scores >= p90, "Sedang", "Rendah"))
    return cats, p90, p95


def categorize_fixed(scores: np.ndarray, p90: float, p95: float) -> np.ndarray:
    """Assign risk categories using fixed baseline thresholds."""
    return np.where(scores >= p95, "Tinggi",
                    np.where(scores >= p90, "Sedang", "Rendah"))


def top_k_indices(scores: np.ndarray, fraction: float) -> set[int]:
    """Return indices of top-k% highest scores."""
    k = max(1, int(np.ceil(len(scores) * fraction)))
    return set(map(int, np.argsort(scores)[::-1][:k]))


def jaccard(a: set[int], b: set[int]) -> float:
    """Jaccard similarity between two sets."""
    union = a | b
    if not union:
        return 1.0
    return len(a & b) / len(union)


# ─────────────────────────────────────────────────────────────────────────────
# 2. EKSPERIMEN A — STABILITAS RANDOM SEED
# ─────────────────────────────────────────────────────────────────────────────

def run_seed_stability(X: np.ndarray) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Run 30 seeds and compute all stability metrics."""
    logging.info("=" * 65)
    logging.info("  EKSPERIMEN A: STABILITAS RANDOM SEED (30 run)")
    logging.info("=" * 65)

    # Baseline run
    logging.info(f"Running baseline seed={BASELINE_SEED}...")
    baseline_scores = fit_if_scores(X, BASELINE_CONFIG, BASELINE_SEED)
    _, baseline_p90, baseline_p95 = categorize_relative(baseline_scores)
    baseline_top5 = top_k_indices(baseline_scores, 0.05)
    baseline_top10 = top_k_indices(baseline_scores, 0.10)
    baseline_cat = categorize_fixed(baseline_scores, baseline_p90, baseline_p95)

    logging.info(f"Baseline P90={baseline_p90:.6f}, P95={baseline_p95:.6f}")
    logging.info(f"Baseline Top-3: {np.argsort(baseline_scores)[::-1][:3]}")

    # All seed runs
    all_scores = {}  # seed -> scores array
    summary_rows = []

    seeds = list(range(N_SEEDS_STABILITY))

    for i, seed in enumerate(seeds):
        t0 = time.time()
        scores = fit_if_scores(X, BASELINE_CONFIG, seed)
        elapsed = time.time() - t0
        all_scores[seed] = scores

        rel_cat, p90, p95 = categorize_relative(scores)
        fixed_cat = categorize_fixed(scores, baseline_p90, baseline_p95)

        rho = float(spearmanr(baseline_scores, scores).statistic)
        top5 = top_k_indices(scores, 0.05)
        top10 = top_k_indices(scores, 0.10)
        j5 = jaccard(baseline_top5, top5)
        j10 = jaccard(baseline_top10, top10)
        agreement = float(np.mean(fixed_cat == baseline_cat))
        kappa = float(cohen_kappa_score(baseline_cat, fixed_cat))

        summary_rows.append({
            "seed": seed,
            "spearman_vs_baseline": round(rho, 6),
            "jaccard_top5_vs_baseline": round(j5, 6),
            "jaccard_top10_vs_baseline": round(j10, 6),
            "fixed_category_agreement": round(agreement, 6),
            "fixed_category_kappa": round(kappa, 6),
            "p90_relative": round(p90, 6),
            "p95_relative": round(p95, 6),
            "n_tinggi_fixed": int(np.sum(fixed_cat == "Tinggi")),
            "n_sedang_fixed": int(np.sum(fixed_cat == "Sedang")),
            "n_rendah_fixed": int(np.sum(fixed_cat == "Rendah")),
            "elapsed_s": round(elapsed, 3),
        })

        if (i + 1) % 5 == 0:
            logging.info(f"  Seed {i+1}/{N_SEEDS_STABILITY} done | Spearman={rho:.4f} | Jaccard5={j5:.4f}")

    summary_df = pd.DataFrame(summary_rows)

    # Pairwise metrics
    logging.info("Computing pairwise metrics across all seed pairs...")
    pairwise_rows = []
    seed_list = list(all_scores.keys())

    for sa, sb in combinations(seed_list, 2):
        a, b = all_scores[sa], all_scores[sb]
        rho = float(spearmanr(a, b).statistic)
        j5 = jaccard(top_k_indices(a, 0.05), top_k_indices(b, 0.05))
        j10 = jaccard(top_k_indices(a, 0.10), top_k_indices(b, 0.10))
        pairwise_rows.append({
            "seed_a": sa, "seed_b": sb,
            "spearman": round(rho, 6),
            "jaccard_top5": round(j5, 6),
            "jaccard_top10": round(j10, 6),
        })

    pairwise_df = pd.DataFrame(pairwise_rows)

    # Selection frequency
    logging.info("Computing selection frequency Top-5%...")
    freq_counts = np.zeros(X.shape[0], dtype=int)
    for seed, scores in all_scores.items():
        for idx in top_k_indices(scores, 0.05):
            freq_counts[idx] += 1

    freq_df = pd.DataFrame({
        "employee_index": np.arange(X.shape[0]),
        "selected_runs": freq_counts,
        "total_runs": N_SEEDS_STABILITY,
        "selection_frequency": np.round(freq_counts / N_SEEDS_STABILITY, 4),
    })
    freq_df = freq_df.sort_values("selection_frequency", ascending=False).reset_index(drop=True)

    # Score variability for Top-20 baseline profiles
    top20_idx = np.argsort(baseline_scores)[::-1][:20]
    var_rows = []
    for eidx in top20_idx:
        scores_across = [all_scores[s][eidx] for s in seed_list]
        var_rows.append({
            "employee_index": int(eidx),
            "baseline_rank": int(np.where(np.argsort(baseline_scores)[::-1] == eidx)[0][0]) + 1,
            "mean_score": round(float(np.mean(scores_across)), 6),
            "std_score": round(float(np.std(scores_across)), 6),
            "min_score": round(float(np.min(scores_across)), 6),
            "max_score": round(float(np.max(scores_across)), 6),
            "cv": round(float(np.std(scores_across) / np.mean(scores_across)) * 100, 2) if np.mean(scores_across) > 0 else 0,
        })
    var_df = pd.DataFrame(var_rows)

    return summary_df, pairwise_df, freq_df, var_df


# ─────────────────────────────────────────────────────────────────────────────
# 3. EKSPERIMEN B — SENSITIVITAS PARAMETER
# ─────────────────────────────────────────────────────────────────────────────

def run_parameter_sensitivity(X: np.ndarray) -> pd.DataFrame:
    """One-factor-at-a-time parameter sensitivity analysis."""
    logging.info("=" * 65)
    logging.info("  EKSPERIMEN B: SENSITIVITAS PARAMETER")
    logging.info("=" * 65)

    # Baseline reference
    baseline_scores = fit_if_scores(X, BASELINE_CONFIG, BASELINE_SEED)
    baseline_top5 = top_k_indices(baseline_scores, 0.05)
    baseline_top10 = top_k_indices(baseline_scores, 0.10)

    # Top-3 baseline indices for frequency tracking
    top3_baseline = set(map(int, np.argsort(baseline_scores)[::-1][:3]))

    param_specs = [
        ("n_estimators", [100, 200, 300, 500]),
        ("max_samples", [128, 256, 512, "auto"]),
        ("max_features", [0.5, 0.75, 1.0]),
    ]

    seeds = list(range(N_SEEDS_PARAM))
    rows = []

    for param_name, values in param_specs:
        logging.info(f"  Testing parameter: {param_name}")
        for value in values:
            config = replace(BASELINE_CONFIG, **{param_name: value})

            spearman_list, j5_list, j10_list = [], [], []
            top3_hit = 0

            for seed in seeds:
                t0 = time.time()
                scores = fit_if_scores(X, config, seed)
                elapsed = time.time() - t0

                rho = float(spearmanr(baseline_scores, scores).statistic)
                j5 = jaccard(baseline_top5, top_k_indices(scores, 0.05))
                j10 = jaccard(baseline_top10, top_k_indices(scores, 0.10))

                # Check if baseline Top-3 are all in this run's Top-5%
                run_top5 = top_k_indices(scores, 0.05)
                if top3_baseline.issubset(run_top5):
                    top3_hit += 1

                spearman_list.append(rho)
                j5_list.append(j5)
                j10_list.append(j10)

                rows.append({
                    "parameter": param_name,
                    "value": str(value),
                    "seed": seed,
                    "spearman_vs_baseline": round(rho, 6),
                    "jaccard_top5_vs_baseline": round(j5, 6),
                    "jaccard_top10_vs_baseline": round(j10, 6),
                    "elapsed_s": round(elapsed, 3),
                })

            logging.info(
                f"    {param_name}={value}: "
                f"Median Spearman={np.median(spearman_list):.4f}, "
                f"Mean J5={np.mean(j5_list):.4f}, "
                f"Top-3 hit={top3_hit}/{N_SEEDS_PARAM}"
            )

    return pd.DataFrame(rows)


# ─────────────────────────────────────────────────────────────────────────────
# 4. VISUALISASI (Grayscale, konsisten dengan skripsi)
# ─────────────────────────────────────────────────────────────────────────────

def plot_spearman_boxplot(pairwise_df: pd.DataFrame, summary_df: pd.DataFrame):
    """Gambar 15: Boxplot distribusi Spearman."""
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    # (a) Pairwise Spearman
    bp1 = axes[0].boxplot(
        pairwise_df["spearman"].values,
        vert=True, patch_artist=True,
        boxprops=dict(facecolor=GRAY_LIGHT, edgecolor=GRAY_DARK),
        medianprops=dict(color=GRAY_DARK, linewidth=2),
        whiskerprops=dict(color=GRAY_DARK),
        capprops=dict(color=GRAY_DARK),
        flierprops=dict(markerfacecolor=GRAY_MED, marker="o", markersize=4),
    )
    axes[0].set_title("(a) Pairwise Spearman\n(antarrun)", fontweight="bold", fontsize=11)
    axes[0].set_ylabel("Koefisien Spearman")
    axes[0].set_xticks([])

    med_pw = pairwise_df["spearman"].median()
    axes[0].axhline(med_pw, color=GRAY_MED, linestyle="--", linewidth=0.8)
    axes[0].text(1.15, med_pw, f"Median={med_pw:.4f}", fontsize=9, va="center", color=GRAY_MED)

    # (b) vs Baseline
    bp2 = axes[1].boxplot(
        summary_df["spearman_vs_baseline"].values,
        vert=True, patch_artist=True,
        boxprops=dict(facecolor=GRAY_LIGHT, edgecolor=GRAY_DARK),
        medianprops=dict(color=GRAY_DARK, linewidth=2),
        whiskerprops=dict(color=GRAY_DARK),
        capprops=dict(color=GRAY_DARK),
        flierprops=dict(markerfacecolor=GRAY_MED, marker="o", markersize=4),
    )
    axes[1].set_title("(b) Spearman vs Baseline\n(seed=42)", fontweight="bold", fontsize=11)
    axes[1].set_ylabel("Koefisien Spearman")
    axes[1].set_xticks([])

    med_bl = summary_df["spearman_vs_baseline"].median()
    axes[1].axhline(med_bl, color=GRAY_MED, linestyle="--", linewidth=0.8)
    axes[1].text(1.15, med_bl, f"Median={med_bl:.4f}", fontsize=9, va="center", color=GRAY_MED)

    fig.suptitle("Konsistensi Ranking Skor Isolation Forest (30 Seed)",
                 fontweight="bold", fontsize=13, y=1.02)
    fig.tight_layout()
    fig.savefig(FIG_DIR / "15_if_spearman_boxplot.png", dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    logging.info("  ✅ Gambar 15 — Spearman Boxplot")


def plot_jaccard_boxplot(pairwise_df: pd.DataFrame, summary_df: pd.DataFrame):
    """Gambar 16: Boxplot Jaccard Top-5% dan Top-10%."""
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    # (a) Pairwise
    data_pw = [pairwise_df["jaccard_top5"].values, pairwise_df["jaccard_top10"].values]
    bp1 = axes[0].boxplot(
        data_pw, vert=True, patch_artist=True,
        labels=["Top-5%", "Top-10%"],
        boxprops=dict(facecolor=GRAY_LIGHT, edgecolor=GRAY_DARK),
        medianprops=dict(color=GRAY_DARK, linewidth=2),
        whiskerprops=dict(color=GRAY_DARK),
        capprops=dict(color=GRAY_DARK),
        flierprops=dict(markerfacecolor=GRAY_MED, marker="o", markersize=4),
    )
    axes[0].set_title("(a) Pairwise Jaccard\n(antarrun)", fontweight="bold", fontsize=11)
    axes[0].set_ylabel("Jaccard Similarity")

    # (b) vs Baseline
    data_bl = [summary_df["jaccard_top5_vs_baseline"].values,
               summary_df["jaccard_top10_vs_baseline"].values]
    bp2 = axes[1].boxplot(
        data_bl, vert=True, patch_artist=True,
        labels=["Top-5%", "Top-10%"],
        boxprops=dict(facecolor=GRAY_LIGHT, edgecolor=GRAY_DARK),
        medianprops=dict(color=GRAY_DARK, linewidth=2),
        whiskerprops=dict(color=GRAY_DARK),
        capprops=dict(color=GRAY_DARK),
        flierprops=dict(markerfacecolor=GRAY_MED, marker="o", markersize=4),
    )
    axes[1].set_title("(b) Jaccard vs Baseline\n(seed=42)", fontweight="bold", fontsize=11)
    axes[1].set_ylabel("Jaccard Similarity")

    fig.suptitle("Konsistensi Anggota Kelompok Prioritas (Jaccard Top-K)",
                 fontweight="bold", fontsize=13, y=1.02)
    fig.tight_layout()
    fig.savefig(FIG_DIR / "16_if_jaccard_boxplot.png", dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    logging.info("  ✅ Gambar 16 — Jaccard Boxplot")


def plot_selection_frequency(freq_df: pd.DataFrame):
    """Gambar 17: Bar chart frekuensi Top-20 profil."""
    top20 = freq_df.head(20).copy()

    fig, ax = plt.subplots(figsize=(14, 6))

    bars = ax.barh(
        [f"Karyawan #{idx}" for idx in top20["employee_index"]],
        top20["selection_frequency"],
        color=GRAY_MED, edgecolor="white", height=0.7,
    )

    # Add percentage labels
    for bar, freq in zip(bars, top20["selection_frequency"]):
        pct = freq * 100
        ax.text(bar.get_width() + 0.01, bar.get_y() + bar.get_height() / 2,
                f"{pct:.0f}%", va="center", fontsize=9, color=GRAY_DARK)

    ax.set_xlabel("Frekuensi Terpilih (proporsi dari 30 run)")
    ax.set_title("Frekuensi Profil Masuk Top-5% dari 30 Pengulangan Seed",
                 fontweight="bold", fontsize=12)
    ax.set_xlim(0, 1.15)
    ax.axvline(0.8, color=GRAY_DARK, linestyle="--", linewidth=0.8, alpha=0.6)
    ax.text(0.81, -0.5, "Batas stabil (80%)", fontsize=8, color=GRAY_MED)
    ax.invert_yaxis()

    fig.tight_layout()
    fig.savefig(FIG_DIR / "17_if_selection_frequency.png", dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    logging.info("  ✅ Gambar 17 — Selection Frequency")


def plot_param_spearman(param_df: pd.DataFrame):
    """Gambar 18: Parameter sensitivity vs Spearman."""
    params = param_df["parameter"].unique()
    fig, axes = plt.subplots(1, len(params), figsize=(5 * len(params), 5))
    if len(params) == 1:
        axes = [axes]

    for ax, pname in zip(axes, params):
        subset = param_df[param_df["parameter"] == pname]
        values = subset["value"].unique()

        data = [subset[subset["value"] == v]["spearman_vs_baseline"].values for v in values]
        bp = ax.boxplot(
            data, vert=True, patch_artist=True,
            labels=[str(v) for v in values],
            boxprops=dict(facecolor=GRAY_LIGHT, edgecolor=GRAY_DARK),
            medianprops=dict(color=GRAY_DARK, linewidth=2),
            whiskerprops=dict(color=GRAY_DARK),
            capprops=dict(color=GRAY_DARK),
        )
        ax.set_title(pname, fontweight="bold", fontsize=11)
        ax.set_ylabel("Spearman vs Baseline")
        ax.set_xlabel("Nilai Parameter")

    fig.suptitle("Sensitivitas Parameter — Korelasi Spearman terhadap Baseline",
                 fontweight="bold", fontsize=13, y=1.02)
    fig.tight_layout()
    fig.savefig(FIG_DIR / "18_if_param_spearman.png", dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    logging.info("  ✅ Gambar 18 — Parameter Sensitivity (Spearman)")


def plot_param_jaccard(param_df: pd.DataFrame):
    """Gambar 19: Parameter sensitivity vs Jaccard Top-5%."""
    params = param_df["parameter"].unique()
    fig, axes = plt.subplots(1, len(params), figsize=(5 * len(params), 5))
    if len(params) == 1:
        axes = [axes]

    for ax, pname in zip(axes, params):
        subset = param_df[param_df["parameter"] == pname]
        values = subset["value"].unique()

        data = [subset[subset["value"] == v]["jaccard_top5_vs_baseline"].values for v in values]
        bp = ax.boxplot(
            data, vert=True, patch_artist=True,
            labels=[str(v) for v in values],
            boxprops=dict(facecolor=GRAY_LIGHT, edgecolor=GRAY_DARK),
            medianprops=dict(color=GRAY_DARK, linewidth=2),
            whiskerprops=dict(color=GRAY_DARK),
            capprops=dict(color=GRAY_DARK),
        )
        ax.set_title(pname, fontweight="bold", fontsize=11)
        ax.set_ylabel("Jaccard Top-5% vs Baseline")
        ax.set_xlabel("Nilai Parameter")

    fig.suptitle("Sensitivitas Parameter — Jaccard Top-5% terhadap Baseline",
                 fontweight="bold", fontsize=13, y=1.02)
    fig.tight_layout()
    fig.savefig(FIG_DIR / "19_if_param_jaccard.png", dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    logging.info("  ✅ Gambar 19 — Parameter Sensitivity (Jaccard)")


# ─────────────────────────────────────────────────────────────────────────────
# 5. MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main():
    logging.info("=" * 65)
    logging.info("  EVALUASI ROBUSTNESS ISOLATION FOREST")
    logging.info("=" * 65)

    # Load preprocessed data from cache
    X = np.load(CACHE_DIR / "X_all.npy")
    logging.info(f"Data loaded: {X.shape[0]} karyawan × {X.shape[1]} fitur")

    # ── EKSPERIMEN A ──
    summary_df, pairwise_df, freq_df, var_df = run_seed_stability(X)

    # Save CSVs
    summary_df.to_csv(OUTPUTS / "if_seed_stability_summary.csv", index=False)
    pairwise_df.to_csv(OUTPUTS / "if_pairwise_metrics.csv", index=False)
    freq_df.to_csv(OUTPUTS / "if_top5_selection_frequency.csv", index=False)
    var_df.to_csv(OUTPUTS / "if_score_variability_top20.csv", index=False)

    # Print summary
    logging.info("\n" + "=" * 65)
    logging.info("  RINGKASAN EKSPERIMEN A — STABILITAS SEED")
    logging.info("=" * 65)

    for col in ["spearman_vs_baseline", "jaccard_top5_vs_baseline",
                "jaccard_top10_vs_baseline", "fixed_category_agreement",
                "fixed_category_kappa"]:
        vals = summary_df[col]
        logging.info(
            f"  {col}: Mean={vals.mean():.4f}, Median={vals.median():.4f}, "
            f"SD={vals.std():.4f}, Min={vals.min():.4f}, Max={vals.max():.4f}"
        )

    # Top-3 frequency
    top3_idx = [918, 1301, 1116]
    logging.info("\n  Frekuensi Top-3 Baseline masuk Top-5%:")
    for eidx in top3_idx:
        row = freq_df[freq_df["employee_index"] == eidx]
        if not row.empty:
            f = row.iloc[0]["selection_frequency"]
            n = int(row.iloc[0]["selected_runs"])
            logging.info(f"    Karyawan #{eidx}: {n}/{N_SEEDS_STABILITY} ({f*100:.0f}%)")

    # ── EKSPERIMEN B ──
    param_df = run_parameter_sensitivity(X)
    param_df.to_csv(OUTPUTS / "if_parameter_sensitivity.csv", index=False)

    logging.info("\n" + "=" * 65)
    logging.info("  RINGKASAN EKSPERIMEN B — SENSITIVITAS PARAMETER")
    logging.info("=" * 65)

    for (pname, pval), grp in param_df.groupby(["parameter", "value"]):
        logging.info(
            f"  {pname}={pval}: "
            f"Median Spearman={grp['spearman_vs_baseline'].median():.4f}, "
            f"Mean J5={grp['jaccard_top5_vs_baseline'].mean():.4f}, "
            f"Mean J10={grp['jaccard_top10_vs_baseline'].mean():.4f}"
        )

    # ── VISUALISASI ──
    logging.info("\n" + "=" * 65)
    logging.info("  GENERATING VISUALISASI (Grayscale)")
    logging.info("=" * 65)

    plot_spearman_boxplot(pairwise_df, summary_df)
    plot_jaccard_boxplot(pairwise_df, summary_df)
    plot_selection_frequency(freq_df)
    plot_param_spearman(param_df)
    plot_param_jaccard(param_df)

    # Final summary
    logging.info("\n" + "=" * 65)
    logging.info("  SELESAI — Semua output tersimpan di:")
    logging.info(f"  CSV: {OUTPUTS}")
    logging.info(f"  PNG: {FIG_DIR}")
    logging.info("=" * 65)

    csv_files = [
        "if_seed_stability_summary.csv",
        "if_pairwise_metrics.csv",
        "if_top5_selection_frequency.csv",
        "if_score_variability_top20.csv",
        "if_parameter_sensitivity.csv",
    ]
    for f in csv_files:
        p = OUTPUTS / f
        if p.exists():
            logging.info(f"  {f:50s} {p.stat().st_size / 1024:.1f} KB")

    fig_files = [
        "15_if_spearman_boxplot.png",
        "16_if_jaccard_boxplot.png",
        "17_if_selection_frequency.png",
        "18_if_param_spearman.png",
        "19_if_param_jaccard.png",
    ]
    for f in fig_files:
        p = FIG_DIR / f
        if p.exists():
            logging.info(f"  {f:50s} {p.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
