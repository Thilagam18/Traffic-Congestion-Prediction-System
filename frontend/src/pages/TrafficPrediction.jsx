import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

// ── Road catalogue ─────────────────────────────────────────────────────────────
const ROADS = [
  { name: "Market District Road",    baseLoad: 0.78, tag: "Commercial" },
  { name: "Downtown Main Street",    baseLoad: 0.72, tag: "Urban core" },
  { name: "Central Avenue",          baseLoad: 0.68, tag: "Arterial" },
  { name: "East Highway I-42",       baseLoad: 0.65, tag: "Expressway" },
  { name: "North Ring Road",         baseLoad: 0.58, tag: "Peripheral" },
  { name: "Airport Link Highway",    baseLoad: 0.55, tag: "Transit" },
  { name: "West Bridge Corridor",    baseLoad: 0.50, tag: "Bridge" },
  { name: "South Bypass Expressway", baseLoad: 0.42, tag: "Bypass" },
  { name: "Commerce Boulevard",      baseLoad: 0.48, tag: "Commercial" },
  { name: "University Avenue",       baseLoad: 0.44, tag: "Residential" },
  { name: "Industrial Park Road",    baseLoad: 0.36, tag: "Industrial" },
  { name: "Riverside Drive",         baseLoad: 0.30, tag: "Scenic" },
];

// ── Core prediction model ──────────────────────────────────────────────────────
// Hourly profile shape (0-23) → multiplier 0..1
const HOUR_PROFILE_WD = [
  0.08, 0.06, 0.05, 0.05, 0.07, 0.14,
  0.30, 0.80, 0.95, 0.72, 0.56, 0.52,
  0.58, 0.54, 0.50, 0.55, 0.66, 0.92,
  0.88, 0.64, 0.46, 0.36, 0.22, 0.13,
];
const HOUR_PROFILE_WE = [
  0.05, 0.04, 0.04, 0.04, 0.05, 0.08,
  0.14, 0.22, 0.34, 0.48, 0.58, 0.64,
  0.68, 0.65, 0.61, 0.58, 0.54, 0.48,
  0.42, 0.35, 0.27, 0.20, 0.13, 0.08,
];

function getProfile(dayOfWeek) {
  return dayOfWeek === 0 || dayOfWeek === 6 ? HOUR_PROFILE_WE : HOUR_PROFILE_WD;
}

function predictHour(road, hour, dayOfWeek, seed = 0) {
  const profile = getProfile(dayOfWeek);
  const raw = road.baseLoad * profile[hour % 24];
  const noise = (Math.sin(seed * 7.3 + hour * 3.1) * 0.04);
  const cong = Math.min(98, Math.max(2, Math.round((raw + noise) * 100)));
  const vehicles = Math.round(cong * 18.5 + 50);
  const speed = Math.round((1 - (cong / 100) * 0.88) * 110 + 8);
  return { cong, vehicles, speed };
}

function congLabel(v) {
  if (v >= 75) return { label: "Severe",   color: "#dc2626", bg: "#fef2f2", bar: "#ef4444" };
  if (v >= 50) return { label: "High",     color: "#ea580c", bg: "#fff7ed", bar: "#f97316" };
  if (v >= 25) return { label: "Moderate", color: "#d97706", bg: "#fffbeb", bar: "#f59e0b" };
  return               { label: "Clear",   color: "#16a34a", bg: "#f0fdf4", bar: "#22c55e" };
}

function confidence(cong, hoursAhead) {
  // Closer horizons have higher confidence; moderate congestion is most predictable
  const horizonPenalty = hoursAhead * 4;
  const extremePenalty = cong > 80 || cong < 15 ? 6 : 0;
  return Math.max(60, 97 - horizonPenalty - extremePenalty);
}

function fmtHour(h) {
  h = ((h % 24) + 24) % 24;
  if (h === 0)  return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function fmtDow(d) {
  return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d];
}

// Find best departure window in the next 6 hours
function bestDeparture(road, startH, startDay) {
  const results = [];
  for (let i = 0; i <= 6; i++) {
    const h = (startH + i) % 24;
    const d = startH + i >= 24 ? (startDay + 1) % 7 : startDay;
    const { cong } = predictHour(road, h, d, i);
    results.push({ offsetH: i, h, d, cong });
  }
  results.sort((a, b) => a.cong - b.cong);
  return results.slice(0, 2);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ForecastChart({ points }) {
  const W = 660, H = 200, PAD = { top: 20, right: 20, bottom: 40, left: 42 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const step = cW / (points.length - 1);
  const [hover, setHover] = useState(null);

  const lineP = points.map((p, i) => `${PAD.left + i * step},${PAD.top + cH - (p.cong / 100) * cH}`).join(" ");
  const areaP = `${PAD.left},${PAD.top + cH} ${lineP} ${PAD.left + (points.length - 1) * step},${PAD.top + cH}`;

  return (
    <svg width={W} height={H} style={{ display: "block", maxWidth: "100%" }}>
      <defs>
        <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Gridlines */}
      {[0, 25, 50, 75, 100].map(v => {
        const y = PAD.top + cH - (v / 100) * cH;
        return (
          <g key={v}>
            <line x1={PAD.left} x2={PAD.left + cW} y1={y} y2={y}
              stroke={v === 0 ? "#cbd5e1" : "#e2e8f0"} strokeWidth={v === 0 ? 1.5 : 1} strokeDasharray={v > 0 ? "4,3" : ""} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">{v}%</text>
          </g>
        );
      })}

      {/* Severity zones */}
      <rect x={PAD.left} y={PAD.top} width={cW} height={(25 / 100) * cH} fill="#dcfce7" opacity={0.35} />
      <rect x={PAD.left} y={PAD.top + (25 / 100) * cH} width={cW} height={(25 / 100) * cH} fill="#fef9c3" opacity={0.35} />
      <rect x={PAD.left} y={PAD.top + (50 / 100) * cH} width={cW} height={(25 / 100) * cH} fill="#ffedd5" opacity={0.35} />
      <rect x={PAD.left} y={PAD.top + (75 / 100) * cH} width={cW} height={(25 / 100) * cH} fill="#fee2e2" opacity={0.35} />

      {/* Area + line */}
      <polygon points={areaP} fill="url(#fcGrad)" />
      <polyline points={lineP} fill="none" stroke="#2563eb" strokeWidth={2.5} strokeLinejoin="round" />

      {/* Points */}
      {points.map((p, i) => {
        const cx = PAD.left + i * step;
        const cy = PAD.top + cH - (p.cong / 100) * cH;
        const cl = congLabel(p.cong);
        const isH = hover === i;
        return (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
            <circle cx={cx} cy={cy} r={isH ? 7 : 5} fill={cl.bar} stroke="white" strokeWidth={2} />
            <text x={cx} y={H - 10} textAnchor="middle" fontSize={10} fill="#64748b" fontWeight={isH ? 700 : 400}>{p.label}</text>
            {isH && (
              <g>
                <rect x={cx - 44} y={cy - 58} width={88} height={52} rx={6} fill="#1e293b" />
                <text x={cx} y={cy - 40} textAnchor="middle" fontSize={10} fill="#94a3b8">{p.label}</text>
                <text x={cx} y={cy - 24} textAnchor="middle" fontSize={12} fill="white" fontWeight={800}>{p.cong}% <tspan fill={cl.bar}>{cl.label}</tspan></text>
                <text x={cx} y={cy - 10} textAnchor="middle" fontSize={10} fill="#94a3b8">{p.conf}% confidence</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function ConfBar({ value }) {
  const color = value >= 88 ? "#16a34a" : value >= 75 ? "#d97706" : "#dc2626";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 80, height: 5, background: "#e5e7eb", borderRadius: 99 }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 700 }}>{value}%</span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function TrafficPrediction() {
  const now = new Date();
  const [selectedRoad, setSelectedRoad] = useState(ROADS[0]);
  const [refHour, setRefHour] = useState(now.getHours());
  const [refDay, setRefDay]   = useState(now.getDay());
  const [horizon, setHorizon] = useState(6);
  const [running, setRunning] = useState(false);
  const [forecast, setForecast] = useState(null);

  const DAYS = [0,1,2,3,4,5,6];

  // Current conditions (right now)
  const current = predictHour(selectedRoad, now.getHours(), now.getDay(), 0);
  const currentLabel = congLabel(current.cong);

  function runPrediction() {
    const points = [];
    for (let i = 0; i <= horizon; i++) {
      const h = (refHour + i) % 24;
      const d = refHour + i >= 24 ? (refDay + 1) % 7 : refDay;
      const pred = predictHour(selectedRoad, h, d, i);
      const conf = i === 0 ? 99 : confidence(pred.cong, i);
      const cl = congLabel(pred.cong);
      points.push({
        offsetH: i, h, d,
        label: i === 0 ? "Now" : `+${i}h`,
        cong: pred.cong,
        vehicles: pred.vehicles,
        speed: pred.speed,
        conf,
        ...cl,
      });
    }
    const best = bestDeparture(selectedRoad, refHour, refDay);
    setForecast({ points, best, road: selectedRoad, generatedAt: new Date() });
  }

  // Auto-run on road change
  useEffect(() => { runPrediction(); }, [selectedRoad, refHour, refDay, horizon]);

  const peak = forecast ? forecast.points.reduce((a, b) => b.cong > a.cong ? b : a) : null;
  const trough = forecast ? forecast.points.reduce((a, b) => b.cong < a.cong ? b : a) : null;

  return (
    <>
      <Navbar />
      <div style={{ padding: "24px 32px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, color: "#0f172a" }}>Congestion Prediction</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
            Time-aware forecasting model · predicts 1–6 hours ahead · confidence-scored per hour
          </p>
        </div>

        {/* ── Controls ── */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14, marginBottom: 14 }}>🎯 Prediction Parameters</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>

            {/* Road */}
            <div style={{ flex: 2, minWidth: 220 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Road</label>
              <select value={selectedRoad.name} onChange={e => setSelectedRoad(ROADS.find(r => r.name === e.target.value))}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, background: "white" }}>
                {ROADS.map(r => (
                  <option key={r.name} value={r.name}>{r.name} ({r.tag})</option>
                ))}
              </select>
            </div>

            {/* Day */}
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Day</label>
              <select value={refDay} onChange={e => setRefDay(Number(e.target.value))}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, background: "white" }}>
                {DAYS.map(d => (
                  <option key={d} value={d}>{["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d]}{d === now.getDay() ? " (Today)" : ""}</option>
                ))}
              </select>
            </div>

            {/* Start hour */}
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>From hour</label>
              <select value={refHour} onChange={e => setRefHour(Number(e.target.value))}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, background: "white" }}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>{fmtHour(h)}{h === now.getHours() && refDay === now.getDay() ? " (now)" : ""}</option>
                ))}
              </select>
            </div>

            {/* Horizon */}
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Forecast horizon</label>
              <select value={horizon} onChange={e => setHorizon(Number(e.target.value))}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, background: "white" }}>
                {[1,2,3,4,5,6].map(h => <option key={h} value={h}>{h} hour{h > 1 ? "s" : ""} ahead</option>)}
              </select>
            </div>

            <button onClick={runPrediction} disabled={running}
              style={{ padding: "10px 22px", background: running ? "#93c5fd" : "#2563eb", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: running ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
              {running ? "⏳ Predicting…" : "🔮 Run Forecast"}
            </button>
          </div>
        </div>

        {/* ── Current conditions ── */}
        <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { icon: "📊", label: "Current Congestion", value: `${current.cong}%`, color: currentLabel.color, sub: currentLabel.label },
            { icon: "🚗", label: "Current Volume",     value: `${current.vehicles.toLocaleString()} veh/hr`, color: "#0891b2", sub: "sensor estimate" },
            { icon: "⚡", label: "Current Speed",      value: `${current.speed} km/h`, color: "#7c3aed", sub: "avg flow" },
            { icon: "📡", label: "Road Type",          value: selectedRoad.tag, color: "#1e3a5f", sub: selectedRoad.name.split(" ").slice(0, 2).join(" ") },
            ...(peak ? [{ icon: "🔺", label: "Forecast Peak",   value: `${peak.cong}% @ ${peak.label}`, color: "#dc2626", sub: fmtHour(peak.h) }] : []),
            ...(trough && trough.label !== "Now" ? [{ icon: "🟢", label: "Best Window",    value: `${trough.cong}% @ ${trough.label}`, color: "#16a34a", sub: fmtHour(trough.h) }] : []),
          ].map(({ icon, label, value, color, sub }) => (
            <div key={label} style={{ flex: 1, minWidth: 140, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginTop: 2 }}>{label}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>{sub}</div>
            </div>
          ))}
        </div>

        {forecast && (
          <>
            {/* ── Forecast chart ── */}
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px", marginBottom: 20, overflowX: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                    📈 {horizon}-Hour Congestion Forecast — {forecast.road.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>
                    {fmtDow(refDay)} {fmtHour(refHour)} → {fmtHour((refHour + horizon) % 24)} · hover points for details
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  {[["#dcfce7","Clear"],["#fef9c3","Moderate"],["#ffedd5","High"],["#fee2e2","Severe"]].map(([bg,l]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6b7280" }}>
                      <div style={{ width: 12, height: 12, background: bg, border: "1px solid #e5e7eb", borderRadius: 2 }} />{l}
                    </div>
                  ))}
                </div>
              </div>
              <ForecastChart points={forecast.points} />
            </div>

            {/* ── Hour-by-hour table + departure advice ── */}
            <div style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>

              {/* Hourly breakdown */}
              <div style={{ flex: 3, minWidth: 300, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                  🕐 Hour-by-Hour Breakdown
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Time","Congestion","Vehicles/hr","Avg Speed","Status","Confidence"].map(h => (
                        <th key={h} style={{ padding: "9px 14px", textAlign: "left", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.points.map((p, i) => {
                      const cl = congLabel(p.cong);
                      return (
                        <tr key={i} style={{ borderBottom: i < forecast.points.length - 1 ? "1px solid #f3f4f6" : "none", background: i === 0 ? "#eff6ff" : "white" }}>
                          <td style={{ padding: "11px 14px", fontWeight: 700, color: "#0f172a" }}>
                            {p.label === "Now" ? <span style={{ color: "#2563eb" }}>▶ Now</span> : p.label} <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>{fmtHour(p.h)}</span>
                          </td>
                          <td style={{ padding: "11px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <div style={{ width: 60, height: 6, background: "#f3f4f6", borderRadius: 99 }}>
                                <div style={{ width: `${p.cong}%`, height: "100%", background: cl.bar, borderRadius: 99 }} />
                              </div>
                              <span style={{ fontWeight: 700, color: cl.color }}>{p.cong}%</span>
                            </div>
                          </td>
                          <td style={{ padding: "11px 14px", color: "#374151" }}>{p.vehicles.toLocaleString()}</td>
                          <td style={{ padding: "11px 14px", color: "#374151" }}>{p.speed} km/h</td>
                          <td style={{ padding: "11px 14px" }}>
                            <span style={{ padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: cl.bg, color: cl.color }}>{cl.label}</span>
                          </td>
                          <td style={{ padding: "11px 14px" }}>
                            <ConfBar value={p.conf} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Departure advice */}
              <div style={{ flex: 2, minWidth: 260, display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Best windows */}
                <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 22px" }}>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14, marginBottom: 14 }}>✈️ Smart Departure Advice</div>
                  {forecast.best.map((b, i) => {
                    const cl = congLabel(b.cong);
                    return (
                      <div key={i} style={{ marginBottom: 12, padding: "14px 16px", background: cl.bg, border: `1px solid ${cl.bar}30`, borderRadius: 10 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: cl.color, marginBottom: 4 }}>
                          {i === 0 ? "🥇 Best departure" : "🥈 2nd best"} · {fmtHour(b.h)}
                        </div>
                        <div style={{ fontSize: 12, color: "#374151" }}>
                          Expected congestion: <strong style={{ color: cl.color }}>{b.cong}%</strong> ({cl.label})
                        </div>
                        {b.offsetH === 0
                          ? <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>Leave now for best conditions</div>
                          : <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>Depart in {b.offsetH} hour{b.offsetH > 1 ? "s" : ""}</div>
                        }
                      </div>
                    );
                  })}
                </div>

                {/* Model info */}
                <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 22px" }}>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14, marginBottom: 12 }}>🧠 Model Information</div>
                  {[
                    ["Method",        "Time-series profile model"],
                    ["Road factor",   `${Math.round(selectedRoad.baseLoad * 100)}% base load`],
                    ["Day pattern",   refDay === 0 || refDay === 6 ? "Weekend (lower peaks)" : "Weekday (rush hours apply)"],
                    ["Generated",     forecast.generatedAt.toLocaleTimeString()],
                    ["Horizon",       `${horizon} hour${horizon > 1 ? "s" : ""}`],
                    ["Avg confidence",`${Math.round(forecast.points.reduce((s, p) => s + p.conf, 0) / forecast.points.length)}%`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                      <span style={{ color: "#9ca3af" }}>{k}</span>
                      <span style={{ color: "#374151", fontWeight: 600, textAlign: "right", maxWidth: 180 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, padding: "10px 12px", background: "#f8fafc", borderRadius: 8, fontSize: 11, color: "#9ca3af", lineHeight: 1.6 }}>
                    Confidence decreases with forecast horizon. Predictions may deviate during incidents, weather events, or public holidays.
                  </div>
                </div>
              </div>
            </div>

            {/* ── Compare all roads at this hour ── */}
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                🛣️ All-Road Snapshot — {fmtDow(refDay)} {fmtHour(refHour)}
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>Predicted congestion across every road at your selected start time</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[...ROADS]
                  .map(r => ({ ...r, pred: predictHour(r, refHour, refDay, 0) }))
                  .sort((a, b) => b.pred.cong - a.pred.cong)
                  .map((r, i) => {
                    const cl = congLabel(r.pred.cong);
                    const isSelected = r.name === selectedRoad.name;
                    return (
                      <div key={r.name}
                        onClick={() => setSelectedRoad(ROADS.find(rd => rd.name === r.name))}
                        style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", borderRadius: 8, border: `1px solid ${isSelected ? "#2563eb" : "#f3f4f6"}`, background: isSelected ? "#eff6ff" : "white", cursor: "pointer" }}>
                        <div style={{ width: 22, fontSize: 11, fontWeight: 700, color: i < 3 ? cl.color : "#9ca3af", textAlign: "center" }}>{i + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? "#1d4ed8" : "#111" }}>
                            {r.name} {isSelected && <span style={{ fontSize: 10, color: "#6366f1", background: "#ede9fe", padding: "1px 7px", borderRadius: 99, marginLeft: 6 }}>selected</span>}
                          </div>
                          <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 120, height: 5, background: "#f3f4f6", borderRadius: 99 }}>
                              <div style={{ width: `${r.pred.cong}%`, height: "100%", background: cl.bar, borderRadius: 99 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: cl.color }}>{r.pred.cong}%</span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", fontSize: 11, color: "#9ca3af" }}>
                          <div>{r.pred.speed} km/h</div>
                          <div>{r.pred.vehicles.toLocaleString()} veh</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 99, background: cl.bg, color: cl.color }}>{cl.label}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
