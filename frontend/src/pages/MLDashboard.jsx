import React, { useState } from "react";

// ── Model metrics ─────────────────────────────────────────────────────────────
const MODEL = {
  name: "Gradient Boosted Decision Tree",
  shortName: "GBDT",
  version: "v2.4.1",
  trainedOn: "2024-11-15",
  accuracy: 94.2,
  precision: 92.8,
  recall: 91.5,
  f1: 92.1,
  auc: 0.973,
  totalPredictions: 18_432,
  correctPredictions: 17_363,
  avgLatency: 12,
  features: 8,
};

// ── Training history (epochs 1-20) ────────────────────────────────────────────
const TRAINING = Array.from({ length: 20 }, (_, i) => ({
  epoch: i + 1,
  trainAcc: Math.min(97, 52 + i * 2.4 + Math.sin(i) * 1.2),
  valAcc:   Math.min(94.2, 48 + i * 2.3 + Math.sin(i + 1) * 1.5),
  trainLoss: Math.max(0.04, 0.85 - i * 0.042 + Math.sin(i) * 0.015),
  valLoss:   Math.max(0.06, 0.91 - i * 0.041 + Math.sin(i + 1) * 0.018),
}));

// ── Feature importance ────────────────────────────────────────────────────────
const FEATURES = [
  { name: "Time of Day",         importance: 0.312, color: "#2563eb" },
  { name: "Day of Week",         importance: 0.224, color: "#7c3aed" },
  { name: "Historical Avg Cong.",importance: 0.188, color: "#0891b2" },
  { name: "Weather Condition",   importance: 0.112, color: "#d97706" },
  { name: "Road Capacity",       importance: 0.078, color: "#16a34a" },
  { name: "Incident Count",      importance: 0.048, color: "#dc2626" },
  { name: "Vehicle Volume",      importance: 0.024, color: "#ea580c" },
  { name: "Wind Speed",          importance: 0.014, color: "#9ca3af" },
];

// ── Confusion matrix (4-class) ────────────────────────────────────────────────
const CLASSES = ["Clear", "Moderate", "High", "Severe"];
const CONF_MATRIX = [
  [4820, 142,  18,   3],
  [165, 5210, 201,  12],
  [22,  188, 4650,  95],
  [5,   14,  112, 2775],
];

// ── Live predictions ──────────────────────────────────────────────────────────
const LIVE_PREDS = [
  { road: "Market District Road",    pred: "High",     conf: 91.4, actual: "High",     correct: true  },
  { road: "Downtown Main Street",    pred: "Moderate", conf: 87.2, actual: "Moderate", correct: true  },
  { road: "East Highway I-42",       pred: "Moderate", conf: 83.6, actual: "High",     correct: false },
  { road: "North Ring Road",         pred: "Clear",    conf: 95.1, actual: "Clear",    correct: true  },
  { road: "Airport Link Highway",    pred: "Moderate", conf: 78.9, actual: "Moderate", correct: true  },
  { road: "West Bridge Corridor",    pred: "Clear",    conf: 92.3, actual: "Clear",    correct: true  },
  { road: "South Bypass Expressway", pred: "Clear",    conf: 96.7, actual: "Clear",    correct: true  },
  { road: "Commerce Boulevard",      pred: "High",     conf: 85.4, actual: "Severe",   correct: false },
  { road: "University Avenue",       pred: "Moderate", conf: 81.1, actual: "Moderate", correct: true  },
  { road: "Industrial Park Road",    pred: "Clear",    conf: 93.8, actual: "Clear",    correct: true  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusStyle(label) {
  const m = {
    Clear:    { color: "#16a34a", bg: "#f0fdf4" },
    Moderate: { color: "#d97706", bg: "#fffbeb" },
    High:     { color: "#ea580c", bg: "#fff7ed" },
    Severe:   { color: "#dc2626", bg: "#fef2f2" },
  };
  return m[label] || { color: "#6b7280", bg: "#f9fafb" };
}

function Badge({ label }) {
  const s = statusStyle(label);
  return <span style={{ padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>{label}</span>;
}

// ── SVG Charts ────────────────────────────────────────────────────────────────
function TrainingChart({ metric }) {
  const W = 600, H = 200, PAD = { top: 16, right: 16, bottom: 36, left: 44 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const [hover, setHover] = useState(null);

  const isAcc = metric === "accuracy";
  const trainKey = isAcc ? "trainAcc" : "trainLoss";
  const valKey   = isAcc ? "valAcc"   : "valLoss";

  const allVals = TRAINING.flatMap(d => [d[trainKey], d[valKey]]);
  const minV = isAcc ? 45  : 0;
  const maxV = isAcc ? 100 : Math.max(...allVals) * 1.1;

  const scaleY = v => PAD.top + cH - ((v - minV) / (maxV - minV)) * cH;
  const scaleX = i => PAD.left + (i / (TRAINING.length - 1)) * cW;

  const trainLine = TRAINING.map((d, i) => `${scaleX(i)},${scaleY(d[trainKey])}`).join(" ");
  const valLine   = TRAINING.map((d, i) => `${scaleX(i)},${scaleY(d[valKey])}`).join(" ");

  const gridVals = isAcc ? [50, 60, 70, 80, 90, 100] : [0, 0.2, 0.4, 0.6, 0.8];

  return (
    <svg width={W} height={H} style={{ display: "block", maxWidth: "100%" }}>
      {gridVals.map(v => {
        const y = scaleY(v);
        return (
          <g key={v}>
            <line x1={PAD.left} x2={PAD.left + cW} y1={y} y2={y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3,3" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">{isAcc ? `${v}%` : v.toFixed(1)}</text>
          </g>
        );
      })}

      <polyline points={trainLine} fill="none" stroke="#2563eb" strokeWidth={2.2} strokeLinejoin="round" />
      <polyline points={valLine}   fill="none" stroke="#7c3aed" strokeWidth={2.2} strokeLinejoin="round" strokeDasharray="5,3" />

      {TRAINING.map((d, i) => {
        const cx = scaleX(i), cyT = scaleY(d[trainKey]), cyV = scaleY(d[valKey]);
        const isH = hover === i;
        return (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
            <rect x={cx - 6} y={PAD.top} width={12} height={cH} fill="transparent" />
            <circle cx={cx} cy={cyT} r={isH ? 5 : 3} fill="#2563eb" stroke="white" strokeWidth={1.5} />
            <circle cx={cx} cy={cyV} r={isH ? 5 : 3} fill="#7c3aed" stroke="white" strokeWidth={1.5} />
            <text x={cx} y={H - 8} textAnchor="middle" fontSize={9} fill="#94a3b8">{d.epoch}</text>
            {isH && (
              <g>
                <rect x={cx - 40} y={PAD.top + 4} width={80} height={42} rx={5} fill="#1e293b" />
                <text x={cx} y={PAD.top + 18} textAnchor="middle" fontSize={9} fill="#94a3b8">Epoch {d.epoch}</text>
                <text x={cx} y={PAD.top + 31} textAnchor="middle" fontSize={10} fill="#93c5fd">Train: {isAcc ? d[trainKey].toFixed(1) + "%" : d[trainKey].toFixed(3)}</text>
                <text x={cx} y={PAD.top + 44} textAnchor="middle" fontSize={10} fill="#c4b5fd">Val: {isAcc ? d[valKey].toFixed(1) + "%" : d[valKey].toFixed(3)}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function ConfusionMatrix() {
  const total = CONF_MATRIX.flat().reduce((a, b) => a + b, 0);
  const rowTotals = CONF_MATRIX.map(row => row.reduce((a, b) => a + b, 0));
  const cellColors = ["#dcfce7", "#fef9c3", "#ffedd5", "#fee2e2"];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ padding: "8px 12px", color: "#9ca3af", fontSize: 10, textAlign: "left" }}>
              Actual ↓ / Pred →
            </th>
            {CLASSES.map((c, j) => (
              <th key={c} style={{ padding: "8px 14px", textAlign: "center", color: "#374151", fontWeight: 700 }}>
                <Badge label={c} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CONF_MATRIX.map((row, i) => (
            <tr key={i}>
              <td style={{ padding: "8px 12px", fontWeight: 700 }}><Badge label={CLASSES[i]} /></td>
              {row.map((val, j) => {
                const isDiag = i === j;
                const opacity = val / (rowTotals[i] || 1);
                return (
                  <td key={j} style={{
                    padding: "10px 14px", textAlign: "center", borderRadius: 6,
                    background: isDiag ? `rgba(37,99,235,${0.12 + opacity * 0.55})` : val > 0 ? `rgba(239,68,68,${opacity * 0.35})` : "#f9fafb",
                    fontWeight: isDiag ? 800 : 400,
                    color: isDiag ? "#1d4ed8" : val > 0 ? "#991b1b" : "#9ca3af",
                    fontSize: isDiag ? 14 : 12,
                    border: isDiag ? "2px solid #bfdbfe" : "1px solid #f3f4f6",
                  }}>
                    {val.toLocaleString()}
                    {isDiag && <div style={{ fontSize: 9, color: "#6b7280", fontWeight: 400, marginTop: 1 }}>{((val / rowTotals[i]) * 100).toFixed(0)}%</div>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MLDashboard() {
  const [chartMetric, setChartMetric] = useState("accuracy");

  const truePos = CONF_MATRIX.reduce((s, row, i) => s + row[i], 0);
  const totalSamples = CONF_MATRIX.flat().reduce((a, b) => a + b, 0);
  const overallAcc = ((truePos / totalSamples) * 100).toFixed(1);

  return (
    <>
      
      <div style={{ padding: "24px 32px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, color: "#0f172a" }}>ML Model Dashboard</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
              {MODEL.name} ({MODEL.shortName}) · {MODEL.version} · Trained {MODEL.trainedOn}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ padding: "6px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#16a34a" }}>
              ✅ Model Active
            </div>
            <div style={{ padding: "6px 14px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#2563eb" }}>
              ⚡ {MODEL.avgLatency}ms avg latency
            </div>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
          {[
            { icon: "🎯", label: "Accuracy",     value: `${MODEL.accuracy}%`,  color: "#16a34a", sub: `${overallAcc}% on test set` },
            { icon: "📐", label: "Precision",    value: `${MODEL.precision}%`, color: "#2563eb", sub: "avg across classes" },
            { icon: "🔍", label: "Recall",       value: `${MODEL.recall}%`,    color: "#7c3aed", sub: "avg across classes" },
            { icon: "⚖️", label: "F1 Score",     value: `${MODEL.f1}%`,        color: "#0891b2", sub: "harmonic mean" },
            { icon: "📊", label: "AUC-ROC",      value: MODEL.auc.toFixed(3),  color: "#d97706", sub: "multi-class OvR" },
            { icon: "🔢", label: "Predictions",  value: MODEL.totalPredictions.toLocaleString(), color: "#1e3a5f", sub: `${MODEL.correctPredictions.toLocaleString()} correct` },
          ].map(({ icon, label, value, color, sub }) => (
            <div key={label} style={{ flex: 1, minWidth: 130, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginTop: 2 }}>{label}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* ── Training history + Feature importance ── */}
        <div style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>

          {/* Training chart */}
          <div style={{ flex: 3, minWidth: 300, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>📈 Training History</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>20 epochs · hover to inspect</div>
              </div>
              <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 3 }}>
                {[["accuracy", "Accuracy"], ["loss", "Loss"]].map(([k, l]) => (
                  <button key={k} onClick={() => setChartMetric(k)} style={{
                    padding: "4px 14px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: chartMetric === k ? "white" : "transparent",
                    color: chartMetric === k ? "#1e3a5f" : "#94a3b8",
                    boxShadow: chartMetric === k ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}>{l}</button>
                ))}
              </div>
            </div>
            <TrainingChart metric={chartMetric} />
            <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
              {[["#2563eb","Training"], ["#7c3aed","Validation (dashed)"]].map(([c, l]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280" }}>
                  <div style={{ width: 20, height: 3, background: c, borderRadius: 2 }} />{l}
                </div>
              ))}
            </div>
          </div>

          {/* Feature importance */}
          <div style={{ flex: 2, minWidth: 260, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>🧬 Feature Importance</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>SHAP-based contribution scores</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {FEATURES.map((f, i) => (
                <div key={f.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{i + 1}. {f.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: f.color }}>{(f.importance * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{ height: 7, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${f.importance * 100 / 0.312}%`, height: "100%", background: f.color, borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Confusion matrix + Live predictions ── */}
        <div style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>

          {/* Confusion matrix */}
          <div style={{ flex: 2, minWidth: 300, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>🔢 Confusion Matrix</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>
              Test set · {totalSamples.toLocaleString()} samples · Blue = correct, Red = error
            </div>
            <ConfusionMatrix />
            <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
              {CLASSES.map((cls, i) => {
                const tp = CONF_MATRIX[i][i];
                const rowTotal = CONF_MATRIX[i].reduce((a, b) => a + b, 0);
                const colTotal = CONF_MATRIX.reduce((s, row) => s + row[i], 0);
                const prec = ((tp / colTotal) * 100).toFixed(0);
                const rec  = ((tp / rowTotal) * 100).toFixed(0);
                const s = statusStyle(cls);
                return (
                  <div key={cls} style={{ fontSize: 11, color: "#374151" }}>
                    <span style={{ color: s.color, fontWeight: 700 }}>{cls}</span>: P={prec}% R={rec}%
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live predictions */}
          <div style={{ flex: 3, minWidth: 300, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
              🚦 Live Road Predictions
              <span style={{ fontSize: 11, fontWeight: 400, color: "#9ca3af", marginLeft: 8 }}>
                {LIVE_PREDS.filter(p => p.correct).length}/{LIVE_PREDS.length} correct ({Math.round(LIVE_PREDS.filter(p => p.correct).length / LIVE_PREDS.length * 100)}%)
              </span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Road", "Prediction", "Actual", "Confidence", ""].map(h => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: "left", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LIVE_PREDS.map((p, i) => (
                  <tr key={i} style={{ borderBottom: i < LIVE_PREDS.length - 1 ? "1px solid #f3f4f6" : "none", background: p.correct ? "white" : "#fef8f8" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111", fontSize: 12 }}>{p.road.split(" ").slice(0, 2).join(" ")}</td>
                    <td style={{ padding: "10px 14px" }}><Badge label={p.pred} /></td>
                    <td style={{ padding: "10px 14px" }}><Badge label={p.actual} /></td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 50, height: 5, background: "#f3f4f6", borderRadius: 99 }}>
                          <div style={{ width: `${p.conf}%`, height: "100%", background: p.conf >= 90 ? "#16a34a" : p.conf >= 80 ? "#d97706" : "#dc2626", borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{p.conf}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center", fontSize: 16 }}>
                      {p.correct ? "✅" : "❌"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Model info ── */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>🧠 Model Architecture & Training Details</div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Architecture</div>
              {[
                ["Algorithm",      "Gradient Boosted Decision Tree (GBDT)"],
                ["Estimators",     "500 trees"],
                ["Max Depth",      "6 levels"],
                ["Learning Rate",  "0.05"],
                ["Subsample",      "0.8"],
                ["Features",       `${MODEL.features} input features`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f9fafb", fontSize: 12 }}>
                  <span style={{ color: "#9ca3af" }}>{k}</span>
                  <span style={{ color: "#374151", fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Training Setup</div>
              {[
                ["Training Samples", "62,400"],
                ["Validation Split", "20%"],
                ["Test Split",       "15%"],
                ["Cross-Validation", "5-fold stratified"],
                ["Loss Function",    "Multi-class log-loss"],
                ["Early Stopping",   "15 rounds patience"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f9fafb", fontSize: 12 }}>
                  <span style={{ color: "#9ca3af" }}>{k}</span>
                  <span style={{ color: "#374151", fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Output Classes</div>
              {[
                ["Clear",    "< 25% congestion",  "#16a34a"],
                ["Moderate", "25–50% congestion", "#d97706"],
                ["High",     "50–75% congestion", "#ea580c"],
                ["Severe",   "> 75% congestion",  "#dc2626"],
              ].map(([cls, desc, color]) => (
                <div key={cls} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f9fafb", fontSize: 12 }}>
                  <span style={{ color, fontWeight: 700 }}>{cls}</span>
                  <span style={{ color: "#9ca3af" }}>{desc}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: "10px 12px", background: "#eff6ff", borderRadius: 8, fontSize: 11, color: "#1d4ed8", lineHeight: 1.6 }}>
                ℹ️ Model auto-retrains weekly on new sensor data. Predictions are cached for 60 seconds per road segment.
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
