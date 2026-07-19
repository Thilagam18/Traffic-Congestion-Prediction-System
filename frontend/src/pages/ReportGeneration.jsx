import React, { useState } from "react";
import Navbar from "../components/Navbar";

// ── Road data (shared model) ───────────────────────────────────────────────────
const ALL_ROADS = [
  { name: "Market District Road",    tag: "Commercial",  baseLoad: 0.78 },
  { name: "Downtown Main Street",    tag: "Urban Core",  baseLoad: 0.72 },
  { name: "Central Avenue",          tag: "Arterial",    baseLoad: 0.68 },
  { name: "East Highway I-42",       tag: "Expressway",  baseLoad: 0.65 },
  { name: "North Ring Road",         tag: "Peripheral",  baseLoad: 0.58 },
  { name: "Airport Link Highway",    tag: "Transit",     baseLoad: 0.55 },
  { name: "West Bridge Corridor",    tag: "Bridge",      baseLoad: 0.50 },
  { name: "Commerce Boulevard",      tag: "Commercial",  baseLoad: 0.48 },
  { name: "South Bypass Expressway", tag: "Bypass",      baseLoad: 0.42 },
  { name: "University Avenue",       tag: "Residential", baseLoad: 0.44 },
  { name: "Industrial Park Road",    tag: "Industrial",  baseLoad: 0.36 },
  { name: "Riverside Drive",         tag: "Scenic",      baseLoad: 0.30 },
];

const HOUR_PROFILE_WD = [
  0.08,0.06,0.05,0.05,0.07,0.14,0.30,0.80,0.95,0.72,0.56,0.52,
  0.58,0.54,0.50,0.55,0.66,0.92,0.88,0.64,0.46,0.36,0.22,0.13,
];

function getRoadStats(road) {
  const now = new Date();
  const h = now.getHours();
  const tf = HOUR_PROFILE_WD[h];
  const hash = road.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const load = Math.min(0.97, road.baseLoad * tf + (hash % 10) / 100);
  const cong = Math.round(load * 100);
  const vehicles = Math.round(load * 1800 + 80);
  const speed = Math.round((1 - load * 0.85) * 110 + 10);
  const peakH = HOUR_PROFILE_WD.indexOf(Math.max(...HOUR_PROFILE_WD));
  const peakLoad = Math.min(0.97, road.baseLoad * 1.0 + (hash % 10) / 100);
  const peakCong = Math.round(peakLoad * 100);
  const incidents = Math.floor(road.baseLoad * 4);

  let status, sColor, sBg;
  if (cong >= 75)      { status = "Severe";   sColor = "#dc2626"; sBg = "#fef2f2"; }
  else if (cong >= 50) { status = "High";     sColor = "#ea580c"; sBg = "#fff7ed"; }
  else if (cong >= 25) { status = "Moderate"; sColor = "#d97706"; sBg = "#fffbeb"; }
  else                 { status = "Clear";    sColor = "#16a34a"; sBg = "#f0fdf4"; }

  return { cong, vehicles, speed, peakCong, peakHour: peakH, incidents, status, sColor, sBg };
}

// ── Query parser ───────────────────────────────────────────────────────────────
function parseQuery(query) {
  const q = query.toLowerCase().trim();
  if (!q) return { type: "none" };

  // "all routes" / "whole network" / "all roads" / "everything"
  if (/\b(all|entire|whole|every|network|full|complete)\b/.test(q) && /\b(road|route|data|traffic|network)\b/.test(q)) {
    return { type: "all" };
  }
  if (/\b(all roads|all routes|show all|full report|network report|every road)\b/.test(q)) {
    return { type: "all" };
  }

  // Match a specific road name
  const matched = ALL_ROADS.filter(r => {
    const nameLower = r.name.toLowerCase();
    const words = nameLower.split(" ");
    return words.some(w => w.length > 3 && q.includes(w)) || q.includes(nameLower);
  });
  if (matched.length > 0) return { type: "specific", roads: matched };

  // Match by tag
  const TAGS = ["commercial","urban","arterial","expressway","peripheral","transit","bridge","bypass","residential","industrial","scenic","highway","downtown","airport","ring","corridor"];
  const tagMatch = TAGS.find(t => q.includes(t));
  if (tagMatch) {
    const byTag = ALL_ROADS.filter(r => r.tag.toLowerCase().includes(tagMatch) || r.name.toLowerCase().includes(tagMatch));
    if (byTag.length > 0) return { type: "tag", roads: byTag, tag: tagMatch };
  }

  // Congestion-level queries
  if (/\b(congested|heavy|busy|severe|high traffic)\b/.test(q)) return { type: "filter", filter: "congested" };
  if (/\b(clear|free|light|open|fast|best)\b/.test(q)) return { type: "filter", filter: "clear" };

  return { type: "unknown" };
}

// ── SUGGESTIONS ────────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Show traffic data for Downtown Main Street",
  "Show all routes traffic data",
  "Traffic data for Airport Link Highway",
  "Show congested roads",
  "East Highway I-42 report",
  "Show expressway data",
  "Traffic data for all commercial roads",
  "Show clear roads only",
  "Market District Road report",
  "Show Riverside Drive traffic",
];

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatusBadge({ status, sColor, sBg }) {
  return (
    <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: sBg, color: sColor }}>
      {status}
    </span>
  );
}

function CongBar({ value }) {
  const color = value >= 75 ? "#ef4444" : value >= 50 ? "#f97316" : value >= 25 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 80, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 99 }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}%</span>
    </div>
  );
}

function RoadCard({ road, stats }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>{road.name}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{road.tag}</div>
        </div>
        <StatusBadge status={stats.status} sColor={stats.sColor} sBg={stats.sBg} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { label: "Congestion",   value: <CongBar value={stats.cong} /> },
          { label: "Vehicles/hr",  value: stats.vehicles.toLocaleString() },
          { label: "Avg Speed",    value: `${stats.speed} km/h` },
          { label: "Peak Cong.",   value: `${stats.peakCong}% @ ${stats.peakHour < 12 ? stats.peakHour + " AM" : stats.peakHour - 12 + " PM"}` },
          { label: "Base Load",    value: `${Math.round(road.baseLoad * 100)}%` },
          { label: "Incidents Today", value: stats.incidents },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 600, marginTop: 3 }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportTable({ roads }) {
  const now = new Date();
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "rgba(255,255,255,0.04)" }}>
            {["#","Road Name","Type","Congestion","Vehicles/hr","Avg Speed","Peak Cong.","Status","Incidents"].map(h => (
              <th key={h} style={{ padding: "9px 14px", textAlign: "left", color: "rgba(255,255,255,0.45)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roads.map((road, i) => {
            const s = getRoadStats(road);
            return (
              <tr key={road.name} style={{ borderBottom: i < roads.length - 1 ? "1px solid #f3f4f6" : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}>
                <td style={{ padding: "11px 14px", color: "rgba(255,255,255,0.4)" }}>{i + 1}</td>
                <td style={{ padding: "11px 14px", fontWeight: 600, color: "white" }}>{road.name}</td>
                <td style={{ padding: "11px 14px", color: "rgba(255,255,255,0.45)" }}>{road.tag}</td>
                <td style={{ padding: "11px 14px" }}><CongBar value={s.cong} /></td>
                <td style={{ padding: "11px 14px", color: "rgba(255,255,255,0.75)" }}>{s.vehicles.toLocaleString()}</td>
                <td style={{ padding: "11px 14px", color: "rgba(255,255,255,0.75)" }}>{s.speed} km/h</td>
                <td style={{ padding: "11px 14px", color: "rgba(255,255,255,0.75)" }}>{s.peakCong}%</td>
                <td style={{ padding: "11px 14px" }}><StatusBadge status={s.status} sColor={s.sColor} sBg={s.sBg} /></td>
                <td style={{ padding: "11px 14px", color: s.incidents > 2 ? "#dc2626" : "#374151", fontWeight: s.incidents > 2 ? 700 : 400 }}>{s.incidents}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SummaryStats({ roads }) {
  const all = roads.map(r => ({ road: r, stats: getRoadStats(r) }));
  const avgCong  = Math.round(all.reduce((s, { stats }) => s + stats.cong, 0) / all.length);
  const totalVeh = all.reduce((s, { stats }) => s + stats.vehicles, 0);
  const avgSpeed = Math.round(all.reduce((s, { stats }) => s + stats.speed, 0) / all.length);
  const severe   = all.filter(({ stats }) => stats.status === "Severe").length;
  const clear    = all.filter(({ stats }) => stats.status === "Clear").length;
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
      {[
        { label: "Roads in Report", value: roads.length, color: "#1e3a5f" },
        { label: "Avg Congestion",  value: `${avgCong}%`, color: avgCong >= 60 ? "#dc2626" : avgCong >= 35 ? "#d97706" : "#16a34a" },
        { label: "Total Veh/hr",    value: totalVeh.toLocaleString(), color: "#0891b2" },
        { label: "Avg Speed",       value: `${avgSpeed} km/h`, color: "#7c3aed" },
        { label: "Severe Roads",    value: severe, color: severe > 0 ? "#dc2626" : "#16a34a" },
        { label: "Clear Roads",     value: clear, color: "#16a34a" },
      ].map(({ label, value, color }) => (
        <div key={label} style={{ flex: 1, minWidth: 110, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600, marginTop: 2 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ReportGeneration() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [result, setResult] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // "table" | "cards"

  const now = new Date();

  function handleGenerate(q) {
    const finalQ = q || query;
    if (!finalQ.trim()) return;
    setSubmitted(finalQ);
    const parsed = parseQuery(finalQ);
    setResult(parsed);
    setViewMode("table");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleGenerate();
  }

  // Which roads to show based on result
  function getRoads() {
    if (!result) return [];
    if (result.type === "all") return ALL_ROADS;
    if (result.type === "specific" || result.type === "tag") return result.roads;
    if (result.type === "filter") {
      return ALL_ROADS.filter(r => {
        const s = getRoadStats(r);
        return result.filter === "congested" ? s.cong >= 50 : s.cong < 25;
      });
    }
    return [];
  }

  const roads = getRoads();

  function resultHeading() {
    if (!result) return "";
    if (result.type === "all") return `Full Network Report — All ${ALL_ROADS.length} Roads`;
    if (result.type === "specific") return roads.length === 1 ? `Road Report: ${roads[0].name}` : `Report: ${roads.length} roads matched`;
    if (result.type === "tag") return `Report: ${roads.length} road${roads.length > 1 ? "s" : ""} (${result.tag} type)`;
    if (result.type === "filter") return `Report: ${roads.length} ${result.filter === "congested" ? "congested" : "clear"} road${roads.length !== 1 ? "s" : ""}`;
    return "";
  }

  return (
    <>
      <Navbar />
      <div style={{ padding: "24px 32px", backgroundColor: "#080d1a", minHeight: "100vh" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, color: "white" }}>Traffic Reports</h1>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            Ask for any road, a group of roads, or the full network — get instant live data
          </p>
        </div>

        {/* Query box */}
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "22px 26px", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 12 }}>🔍 What report do you need?</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='e.g. "Show traffic data for Downtown Main Street" or "Show all routes"'
              style={{ flex: 1, padding: "11px 16px", border: "2px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", transition: "border 0.2s" }}
              onFocus={e => e.target.style.borderColor = "#2563eb"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
            />
            <button
              onClick={() => handleGenerate()}
              disabled={!query.trim()}
              style={{ padding: "11px 26px", background: !query.trim() ? "#93c5fd" : "#2563eb", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: !query.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
              Generate Report
            </button>
          </div>

          {/* Suggestions */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Quick examples</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => { setQuery(s); handleGenerate(s); }}
                  style={{ padding: "5px 12px", background: "rgba(255,255,255,0.06)", border: "1px solid #e2e8f0", borderRadius: 99, fontSize: 12, color: "#475569", cursor: "pointer", fontWeight: 500 }}
                  onMouseEnter={e => { e.target.style.background = "#dbeafe"; e.target.style.color = "#1d4ed8"; }}
                  onMouseLeave={e => { e.target.style.background = "#f1f5f9"; e.target.style.color = "#475569"; }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Unknown / no match */}
            {(result.type === "unknown" || (roads.length === 0 && result.type !== "none")) && (
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 12, padding: "24px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🤔</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#dc2626", marginBottom: 6 }}>No matching roads found</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                  Try mentioning a road name like <em>"Downtown Main Street"</em>, a type like <em>"expressway"</em>, or say <em>"show all routes"</em>.
                </div>
              </div>
            )}

            {roads.length > 0 && (
              <>
                {/* Report header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "white" }}>{resultHeading()}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                      Query: <em>"{submitted}"</em> · Generated {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · Data live
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {/* View toggle */}
                    <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 3 }}>
                      {[["table","📋 Table"],["cards","🃏 Cards"]].map(([v, l]) => (
                        <button key={v} onClick={() => setViewMode(v)} style={{
                          padding: "5px 14px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600,
                          background: viewMode === v ? "rgba(37,99,235,0.3)" : "transparent",
                          color: viewMode === v ? "white" : "rgba(255,255,255,0.5)", cursor: "pointer",
                        }}>{l}</button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        const roadsForExport = roads.map(r => {
                          const s = getRoadStats(r);
                          return [r.name, r.tag, `${s.cong}%`, s.vehicles, `${s.speed} km/h`, `${s.peakCong}%`, s.status, s.incidents].join(",");
                        });
                        const csv = ["Road Name,Type,Congestion,Vehicles/hr,Avg Speed,Peak Cong,Status,Incidents", ...roadsForExport].join("\n");
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a"); a.href = url; a.download = "traffic-report.csv"; a.click();
                        URL.revokeObjectURL(url);
                      }}
                      style={{ padding: "7px 16px", background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      ⬇️ CSV
                    </button>
                    <button
                      onClick={() => window.print()}
                      style={{ padding: "7px 16px", background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      🖨️ Print / PDF
                    </button>
                  </div>
                </div>

                {/* Summary stats */}
                <SummaryStats roads={roads} />

                {/* Report content */}
                <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden" }}>
                  {viewMode === "table" ? (
                    <>
                      <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontWeight: 700, color: "white", fontSize: 14 }}>
                        📋 Detailed Traffic Report
                      </div>
                      <ReportTable roads={roads} />
                    </>
                  ) : (
                    <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                      {roads.map(road => (
                        <RoadCard key={road.name} road={road} stats={getRoadStats(road)} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Single-road full detail */}
                {roads.length === 1 && (() => {
                  const s = getRoadStats(roads[0]);
                  const road = roads[0];
                  const hourly = HOUR_PROFILE_WD.map((p, h) => {
                    const load = Math.min(0.97, road.baseLoad * p);
                    return { h, cong: Math.round(load * 100) };
                  });
                  const peakH = hourly.reduce((a, b) => b.cong > a.cong ? b : a);
                  const offH  = hourly.reduce((a, b) => b.cong < a.cong ? b : a);
                  function fmtH(h) { return h === 0 ? "12 AM" : h === 12 ? "12 PM" : h < 12 ? `${h} AM` : `${h-12} PM`; }

                  return (
                    <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {/* Hourly profile mini chart */}
                      <div style={{ flex: 2, minWidth: 280, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 24px" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 14 }}>
                          📈 24-Hour Congestion Profile
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80 }}>
                          {hourly.map(({ h, cong }) => {
                            const color = cong >= 75 ? "#ef4444" : cong >= 50 ? "#f97316" : cong >= 25 ? "#f59e0b" : "#22c55e";
                            const barH = Math.max(4, (cong / 100) * 80);
                            const isNow = h === new Date().getHours();
                            return (
                              <div key={h} title={`${fmtH(h)}: ${cong}%`} style={{ flex: 1, height: barH, background: color, borderRadius: "2px 2px 0 0", opacity: isNow ? 1 : 0.75, border: isNow ? "2px solid #1e3a5f" : "none", cursor: "pointer" }} />
                            );
                          })}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                          {[0,6,12,18,23].map(h => <span key={h}>{fmtH(h)}</span>)}
                        </div>
                        <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>🔺 Peak: <strong style={{ color: "#dc2626" }}>{peakH.cong}% at {fmtH(peakH.h)}</strong></div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>🟢 Best: <strong style={{ color: "#16a34a" }}>{offH.cong}% at {fmtH(offH.h)}</strong></div>
                        </div>
                      </div>

                      {/* Road insights */}
                      <div style={{ flex: 1, minWidth: 220, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 24px" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 14 }}>💡 Road Insights</div>
                        {[
                          { icon: "🛣️", k: "Road type",         v: road.tag },
                          { icon: "📊", k: "Current status",    v: <span style={{ color: s.sColor, fontWeight: 700 }}>{s.status}</span> },
                          { icon: "⚡", k: "Live speed",        v: `${s.speed} km/h` },
                          { icon: "🚗", k: "Volume now",        v: `${s.vehicles.toLocaleString()} veh/hr` },
                          { icon: "📈", k: "Peak congestion",   v: `${s.peakCong}% at ${fmtH(s.peakHour)}` },
                          { icon: "⚠️", k: "Incidents today",   v: s.incidents },
                          { icon: "🏋️", k: "Road base load",   v: `${Math.round(road.baseLoad * 100)}% capacity` },
                          { icon: "✅", k: "Best travel",       v: `${offH.cong}% at ${fmtH(offH.h)}` },
                        ].map(({ icon, k, v }) => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f9fafb", fontSize: 13 }}>
                            <span style={{ color: "rgba(255,255,255,0.45)" }}>{icon} {k}</span>
                            <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

              </>
            )}
          </>
        )}

        {/* Empty state */}
        {!result && (
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "48px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 8 }}>Start with a query</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", maxWidth: 480, margin: "0 auto" }}>
              Type the name of any road to get its detailed traffic report, or ask for all routes to see the full network snapshot. Use the quick examples above to get started.
            </div>
          </div>
        )}
      </div>
    </>
  );
}
