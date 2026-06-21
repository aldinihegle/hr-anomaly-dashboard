"""
Flask Model Microservice
========================
Melayani prediksi anomali karyawan menggunakan pipeline
yang sepenuhnya tersimpan di folder outputs/ lokal.

Pipeline:
  Isolation Forest → normalisasi [0,1] → kategorisasi P90/P95
  XGBoost Surrogate → SHAP (TreeSHAP) lokal

Semua artefak dibaca dari model/outputs/ — TIDAK bergantung
pada folder lain di luar hr-anomaly-dashboard/.

Run:
    python app.py
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap
from flask import Flask, jsonify, request
from flask_cors import CORS

# ── Paths (lokal, self-contained) ─────────────────────────────────────────
BASE_DIR    = Path(__file__).parent
OUTPUTS_DIR = Path(os.environ.get("OUTPUTS_DIR", str(BASE_DIR / "outputs")))

# Kolom yang dibuang sesuai development_ml.py (tidak masuk ke training)
_BUANG = {"EmployeeCount", "Over18", "StandardHours", "EmployeeNumber",
          "Attrition", "anomaly_score_if", "risk_category"}

# ── Model state ────────────────────────────────────────────────────────────
_if_model:  object | None = None
_surrogate: object | None = None
_encoder:   object | None = None
_scaler:    object | None = None
_explainer: object | None = None

_p90: float = 0.582
_p95: float = 0.647
_raw_min: float = 0.0
_raw_max: float = 1.0

_cat_cols: list[str] = []
_num_cols: list[str] = []
_feat_names: list[str] = []   # urutan setelah encoding: num_cols + cat_encoded


def _load_artifacts() -> None:
    global _if_model, _surrogate, _encoder, _scaler, _explainer
    global _p90, _p95, _raw_min, _raw_max, _cat_cols, _num_cols, _feat_names

    _if_model  = joblib.load(OUTPUTS_DIR / "isolation_forest_model.joblib")
    _surrogate = joblib.load(OUTPUTS_DIR / "xgboost_surrogate_pipeline.joblib")
    _encoder   = joblib.load(OUTPUTS_DIR / "encoder.joblib")
    _scaler    = joblib.load(OUTPUTS_DIR / "scaler.joblib")

    # Baca threshold & statistik dari development_summary.json
    with open(OUTPUTS_DIR / "development_summary.json") as f:
        summary = json.load(f)

    _p90 = float(summary["isolation_forest"]["thresholds"]["p90"])
    _p95 = float(summary["isolation_forest"]["thresholds"]["p95"])

    # Identifikasi kolom fitur dari scoring CSV
    df_ref = pd.read_csv(OUTPUTS_DIR / "anomaly_scoring_results.csv")
    feature_df = df_ref.drop(columns=[c for c in _BUANG if c in df_ref.columns])
    _cat_cols  = feature_df.select_dtypes(include="object").columns.tolist()
    _num_cols  = feature_df.select_dtypes(include=np.number).columns.tolist()

    # Hitung batas raw IF score dari data referensi (untuk normalisasi konsisten)
    X_ref  = _preprocess_df(feature_df)
    raw    = -_if_model.score_samples(X_ref)   # type: ignore[attr-defined]
    _raw_min = float(raw.min())
    _raw_max = float(raw.max())

    # Feature names setelah encoding: numerik dulu, lalu kategorikal (one-hot)
    cat_encoded   = _encoder.get_feature_names_out(_cat_cols).tolist()
    _feat_names   = _num_cols + cat_encoded

    # SHAP explainer pada XGBoost (step "model" di Pipeline)
    xgb_model  = _surrogate.named_steps["model"]   # type: ignore[attr-defined]
    _explainer = shap.TreeExplainer(xgb_model)

    print(f"✅  Artifacts loaded from {OUTPUTS_DIR}")
    print(f"📊  cat={len(_cat_cols)} num={len(_num_cols)} feats={len(_feat_names)}")
    print(f"    P90={_p90:.4f} | P95={_p95:.4f} | raw[{_raw_min:.4f}, {_raw_max:.4f}]")


def _preprocess_df(df: pd.DataFrame) -> np.ndarray:
    """
    Preprocessing identik dengan development_ml.py:
      scaler(num_cols) + encoder(cat_cols) → np.hstack([X_num, X_cat])
    """
    X_num = _scaler.transform(df[_num_cols].values)       # type: ignore[attr-defined]
    X_cat = _encoder.transform(df[_cat_cols])             # type: ignore[attr-defined]
    return np.hstack([X_num, X_cat])


def _normalize(raw_scores: np.ndarray) -> np.ndarray:
    return np.clip(
        (raw_scores - _raw_min) / (_raw_max - _raw_min + 1e-9),
        0.0, 1.0
    )


def _risk(score: float) -> str:
    if score >= _p95:
        return "tinggi"
    if score >= _p90:
        return "sedang"
    return "rendah"


# ── Flask app ──────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)


@app.before_request
def ensure_loaded() -> None:
    if _if_model is None:
        _load_artifacts()


@app.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "outputs_dir": str(OUTPUTS_DIR),
        "p90": _p90,
        "p95": _p95,
        "raw_min": _raw_min,
        "raw_max": _raw_max,
        "n_features": len(_feat_names),
    })


@app.post("/predict")
def predict():
    """
    POST /predict
    Body: JSON array/object dengan raw HR features (tanpa kolom model output).
    Response: list of { anomaly_score_if, risk_category, local_shap_top10 }
    """
    data = request.get_json(force=True)
    if not isinstance(data, list):
        data = [data]

    df = pd.DataFrame(data)
    # Buang kolom yang tidak terpakai jika ada
    df.drop(columns=[c for c in _BUANG if c in df.columns], errors="ignore", inplace=True)

    X = _preprocess_df(df)

    # Isolation Forest → normalisasi
    raw_scores  = -_if_model.score_samples(X)          # type: ignore[attr-defined]
    norm_scores = _normalize(raw_scores)

    # SHAP dari surrogate XGBoost
    shap_values = _explainer.shap_values(X)             # type: ignore[attr-defined]

    results = []
    for i, score in enumerate(norm_scores):
        sv = shap_values[i].tolist()
        local_shap = sorted(
            [{"feature": _feat_names[j], "shap": sv[j]} for j in range(len(sv))],
            key=lambda x: abs(x["shap"]),
            reverse=True,
        )[:10]
        results.append({
            "anomaly_score_if": float(score),
            "risk_category": _risk(float(score)),
            "local_shap_top10": local_shap,
        })

    return jsonify(results)


@app.get("/shap/global")
def shap_global():
    top = min(int(request.args.get("top", 10)), 50)
    df  = pd.read_csv(OUTPUTS_DIR / "shap_global_importance.csv").nlargest(top, "mean_abs_shap")
    return jsonify(df.to_dict(orient="records"))


@app.get("/summary")
def model_summary():
    with open(OUTPUTS_DIR / "development_summary.json") as f:
        return jsonify(json.load(f))


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
