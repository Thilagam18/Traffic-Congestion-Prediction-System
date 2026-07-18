import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

// ── Road catalogue ─────────────────────────────────────────────────────────────
const ROADS = [
  { name: "Market District Road",    baseLoad: 0.78, tag: "Commercial",  lat: 12.97, lon: 77.59 },
  { name: "Downtown Main Street",    baseLoad: 0.72, tag: "Urban core",  lat: 12.98, lon: 77.60 },
  { name: "Central Avenue",          baseLoad: 0.68, tag: "Arterial",    lat: 12.96, lon: 77.58 },
  { name: "East Highway I-42",       baseLoad: 0.65, tag: "Expressway",  lat: 12.99, lon: 77.62 },
  { name: "North Ring Road",         baseLoad: 0.58, tag: "Peripheral",  lat: 13.01, lon: 77.56 },
  { name: "Airport Link Highway",    baseLoad: 0.55, tag: "Transit",     lat: 13.00, lon: 77.61 },
  { name: "West Bridge Corridor",    baseLoad: 0.50, tag: "Bridge",      lat: 12.95, lon: 77.55 },
  { name: "South Bypass Expressway", baseLoad: 0.42, tag: "Bypass",      lat: 12.94, lon: 77.57 },
  { name: "Commerce Boulevard",      baseLoad: 0.48, tag: "Commercial",  lat: 12.97, lon: 77.63 },
  { name: "University Avenue",       baseLoad: 0.44, tag: "Residential", lat: 12.96, lon: 77.55 },
  { name: "Industrial Park Road",    baseLoad: 0.36, tag: "Industrial",  lat: 12.93, lon: 77.60 },
  { name: "Riverside Drive",         baseLoad: 0.30, tag: "Scenic",      lat: 12.95, lon: 77.64 },
];

const WEATHER_CONDITIONS = [
  { id: "clear",  label: "Clear",       emoji: "☀️",  factor: 0,    delay: 0  },
  { id: "cloudy", label: "Cloudy",      emoji: "☁️",  factor: 0.05, delay: 2  },
  { id: "drizzle",label: "Drizzle",     emoji: "🌦️", factor: 0.12, delay: 5  },
  { id: "rain",   label: "Rain",        emoji: "🌧️", factor: 0.22, delay: 12 },
  { id: "fog",    label: "Fog",         emoji: "🌫️", factor: 0.30, delay: 18 },
  { id: "storm",  label: "Thunderstorm",emoji: "⛈️", factor: 0.40, delay: 25 },
  { id: "flood",  label: "Flash Flood", emoji: "🌊",  factor: 0.65, delay: 45 },
];

const REASON_TEMPLATES = {
  time: [
    { reason: "Peak Rush Hour", icon: "⏰", weight: w => w > 0.6 ? 0.35 : 0.10 },
    { reason: "School Zone Pickup", icon: "🏫", weight: w => (w > 0.4 && w < 0.7) ? 0.15 : 0.03 },
    { reason: "Lunch Hour Surge",   icon: "🍽️", weight: w => (w > 0.3 && w < 0.6) ? 0.12 : 0.04 },
  ],
  infra: [
    { reason: "Reduced Lane Capacity",icon: "🚧", weight: w => w > 0.65 ? 0.18 : 0.05 },
    { reason: "Signal Timing Issue",  icon: "🚦", weight: w => w > 0.55 ? 0.14 : 0.06 },
    { reason: "Road Narrowing",       icon: "⚠️", weight: w => w > 0.50 ? 0.10 : 0.02 },
  ],
  event: [
    { reason: "Nearby Event / Venue", icon: "🎭", weight: w => w > 0.70 ? 0.22 : 0.08 },
    { reason: "Construction Activity",icon: "🏗️", weight: w => w > 0.45 ? 0.16 : 0.04 },
    { reason: "Accident Upstream",    icon: "🚨", weight: w => w > 0.60 ? 0.20 : 0.05 },
  ],
  demand: [
    { reason: "High Vehicle Volume",  icon: "🚗", weight: w => 0.25 + w * 0.15 },
    { reason: "Commercial Deliveries",icon: "📦", weight: w => w * 0.12 },
    { reason: "Tourist Traffic",      icon: "🗺️", weight: w => w * 0.08 },
  ],
};

function explainCongestion(road, weather, hour, day) {
  const isWeekend = day === 0 || day === 6;
  const isMorningRush = hour >= 7 && hour <= 9;
  const isEveningRush = hour >= 17 && hour <= 19;
  const isRush = !isWeekend && (isMorningRush || isEveningRush);
  const isLunch = hour >= 12 && hour <= 14;

  const hourMultiplier = isRush ? 1.0 : isLunch ? 0.65 : isWeekend ? 0.45 : 0.60;
  const baseLoad = road.baseLoad * hourMultiplier;
  const weatherFactor = weather.factor;
  const totalLoad = Math.min(0.98, baseLoad + weatherFactor * 0.5 + (Math.sin(road.baseLoad * 13) * 0.04));
  const congestion = Math.round(totalLoad * 100);

  // Build reasons
  const reasons = [];
  const allReasons = [
    ...REASON_TEMPLATES.time,
    ...REASON_TEMPLATES.infra,
    ...REASON_TEMPLATES.event,
    ...REASON_TEMPLATES.demand,
  ];

  for (const r of allReasons) {
    const w = r.weight(totalLoad);
    if (w > 0.06) {
      reasons.push({ ...r, contribution: Math.round(w * 100) });
    }
  }
  reasons.sort((a, b) => b.contribution - a.contribution);

  // Weather-specific reason
  if (weather.id !== "clear") {
    reasons.unshift({
      reason: `Weather: ${weather.label}`,
      icon: weather.emoji,
      contribution: Math.round(weatherFactor * 60),
    });
  }

  const top = reasons.slice(0, 4);
  const totalContrib = top.reduce((s, r) => s + r.contribution, 0);
  const normalized = top.map(r => ({ ...r, contribution: Math.round((r.contribution / totalContrib) * 100) }));

  // Expected clearance
  const clearMinutes = Math.round((totalLoad * 60) + weather.delay);
  const clearTime = new Date(Date.now() + clearMinutes * 60000);
  const clearStr = clearTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Delay estimate
  const delayMin = Math.round(totalLoad * 22 + weather.delay * 0.5);

  // Confidence
  const conf = Math.max(72, 97 - Math.round(weatherFactor * 30) - (congestion > 85 ? 5 : 0));

  // AI summary
  const levelWord = congestion >= 75 ? "severe" : congestion >= 50 ? "high" : congestion >= 25 ? "moderate" : "light";
  const timeContext = isRush ? (isMorningRush ? "morning rush hour" : "evening rush hour") : isWeekend ? "weekend" : "off-peak hours";
  const summary = `${road.name} is currently experiencing ${levelWord} congestion (${congestion}%) during ${timeContext}. `
    + `The primary driver is ${normalized[0]?.reason || "high vehicle volume"} contributing ${normalized[0]?.contribution || 30}% of the delay. `
    + (weather.id !== "clear" ? `${weather.label} conditions are adding approximately ${weather.delay} minutes to typical travel times. ` : "")
    + `Congestion is expected to clear by ${clearStr}, with an estimated delay of ${delayMin} minutes above normal. `
    + `Recommended action: ${congestion >= 75 ? "seek an alternate route immediately" : congestion >= 50 ? "consider delaying travel by 20–30 minutes" : "proceed with caution"}.`;

  const speedKmh = Math.round((1 - totalLoad * 0.88) * 110 + 8);
  const vehicles = Math.round(totalLoad * 1800 + 80);

  return { congestion, levelWord, normalized, clearStr, clearMinutes, delayMin, conf, summary, speedKmh, vehicles };
}

function congColor(v) {
  if (v >= 75) return { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Severe" };
  if (v >= 50) return { color: "#f97316", bg: "rgba(249,115,22,0.12)", label: "High" };
  if (v >= 25) return { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Moderate" };
  return { color: "#22c55e", bg: "rgba(34,197,94,0.12)", label: "Clear" };
}

// ── Glass card component ────────────────────────────────────────────────────────
function Glass({ children, style = {} }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 16,
      backdropFilter: "blur(20px)",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Donut chart ─────────────────────────────────────────────────────────────────
function DonutChart({ value, max = 100, color, size = 120 }) {
  const r = size / 2 - 12;
  const circ = 2 * Math.PI * r;
  const dash = (value / max) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dasharray 0.8s ease" }} />
      <text x={size/2} y={size/2 - 4} textAnchor="middle" fontSize={18} fontWeight={800} fill="white">{value}%</text>
      <text x={size/2} y={size/2 + 14} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.5)">congestion</text>
    </svg>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ExplainableAI() {
  const now = new Date();
  const [road, setRoad] = useState(ROADS[0]);
  const [weather, setWeather] = useState(WEATHER_CONDITIONS[0]);
  const [hour, setHour] = useState(now.getHours());
  const [day, setDay] = useState(now.getDay());
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  function analyze() {
    setLoading(true);
    setTimeout(() => {
      setResult(explainCongestion(road, weather, hour, day));
      setLoading(false);
      setAnalyzed(true);
    }, 900);
  }

  useEffect(() => { analyze(); }, []);

  const cl = result ? congColor(result.congestion) : congColor(0);
  const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  const S = {
    page: { backgroundColor: "#0a0f1e", minHeight: "100vh", padding: "28px 32px", fontFamily: "system-ui, sans-serif" },
    h1: { margin: 0, fontSize: 26, fontWeight: 800, color: "white", letterSpacing: "-0.5px" },
    sub: { margin: "6px 0 0", color: "rgba(255,255,255,0.45)", fontSize: 14 },
    label: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 },
    select: { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, fontSize: 13, color: "white", outline: "none", cursor: "pointer" },
    badge: (c, bg) => ({ padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, background: bg, color: c, border: `1px solid ${c}40` }),
  };

  return (
    <>
      <Navbar />
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes glow { 0%,100% { box-shadow:0 0 20px rgba(139,92,246,0.15); } 50% { box-shadow:0 0 40px rgba(139,92,246,0.3); } }
        select option { background: #1a1f2e; color: white; }
        .xai-select:focus { border-color: rgba(139,92,246,0.6) !important; }
      `}</style>
      <div style={S.page}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#8b5cf6,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🧠</div>
            <div>
              <h1 style={S.h1}>Explainable AI — Traffic Reason Analyzer</h1>
              <p style={S.sub}>Understand why congestion occurs, not just how severe it is</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <Glass style={{ padding:"24px 28px", marginBottom:24 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"white", marginBottom:18 }}>🎛️ Analysis Parameters</div>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-end" }}>
            <div style={{ flex:2, minWidth:200 }}>
              <label style={S.label}>Road</label>
              <select className="xai-select" value={road.name} onChange={e => setRoad(ROADS.find(r => r.name === e.target.value))} style={S.select}>
                {ROADS.map(r => <option key={r.name} value={r.name}>{r.name} ({r.tag})</option>)}
              </select>
            </div>
            <div style={{ flex:1, minWidth:150 }}>
              <label style={S.label}>Weather</label>
              <select className="xai-select" value={weather.id} onChange={e => setWeather(WEATHER_CONDITIONS.find(w => w.id === e.target.value))} style={S.select}>
                {WEATHER_CONDITIONS.map(w => <option key={w.id} value={w.id}>{w.emoji} {w.label}</option>)}
              </select>
            </div>
            <div style={{ flex:1, minWidth:130 }}>
              <label style={S.label}>Day</label>
              <select className="xai-select" value={day} onChange={e => setDay(Number(e.target.value))} style={S.select}>
                {DAYS.map((d, i) => <option key={i} value={i}>{d}{i === now.getDay() ? " ★" : ""}</option>)}
              </select>
            </div>
            <div style={{ flex:1, minWidth:120 }}>
              <label style={S.label}>Hour</label>
              <select className="xai-select" value={hour} onChange={e => setHour(Number(e.target.value))} style={S.select}>
                {Array.from({length:24},(_,h)=>(
                  <option key={h} value={h}>{h===0?"12 AM":h<12?`${h} AM`:h===12?"12 PM":`${h-12} PM`}{h===now.getHours()?" (now)":""}</option>
                ))}
              </select>
            </div>
            <button onClick={analyze} disabled={loading} style={{
              padding:"11px 28px", background: loading ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg,#8b5cf6,#3b82f6)",
              color:"white", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 20px rgba(139,92,246,0.4)", whiteSpace:"nowrap",
            }}>
              {loading ? "⏳ Analyzing…" : "🔍 Analyze"}
            </button>
          </div>
        </Glass>

        {result && !loading && (
          <div style={{ animation:"fadeUp 0.5s ease" }}>

            {/* KPI row */}
            <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
              {[
                { icon:"📊", label:"Congestion Level", value:`${result.congestion}%`, color: cl.color, sub: cl.label },
                { icon:"⚡", label:"Avg Speed",         value:`${result.speedKmh} km/h`, color:"#38bdf8", sub:"current flow" },
                { icon:"🚗", label:"Vehicle Volume",    value:`${result.vehicles.toLocaleString()}`, color:"#a78bfa", sub:"veh/hr" },
                { icon:"⏱️", label:"Added Delay",      value:`+${result.delayMin} min`, color:"#fb923c", sub:"above normal" },
                { icon:"✅", label:"Clears At",         value:result.clearStr, color:"#4ade80", sub:`in ~${result.clearMinutes} min` },
                { icon:"🎯", label:"Confidence",        value:`${result.conf}%`, color:"#f472b6", sub:"prediction certainty" },
              ].map(({icon,label,value,color,sub}) => (
                <Glass key={label} style={{ flex:1, minWidth:130, padding:"18px 20px" }}>
                  <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
                  <div style={{ fontSize:22, fontWeight:800, color }}>{value}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.7)", marginTop:4 }}>{label}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{sub}</div>
                </Glass>
              ))}
            </div>

            {/* Main analysis grid */}
            <div style={{ display:"flex", gap:20, marginBottom:24, flexWrap:"wrap" }}>

              {/* Left: Congestion visual + reasons */}
              <div style={{ flex:2, minWidth:300, display:"flex", flexDirection:"column", gap:20 }}>

                {/* Congestion meter */}
                <Glass style={{ padding:"28px", display:"flex", gap:28, alignItems:"center", flexWrap:"wrap" }}>
                  <DonutChart value={result.congestion} color={cl.color} size={130} />
                  <div style={{ flex:1, minWidth:180 }}>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", marginBottom:6 }}>Current Status</div>
                    <div style={{ fontSize:28, fontWeight:900, color: cl.color, marginBottom:8 }}>{cl.label} Traffic</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.6 }}>
                      <div>🛣️ {road.name} — {road.tag}</div>
                      <div>{weather.emoji} {weather.label} conditions</div>
                      <div>📅 {DAYS[day]} · {hour === 0 ? "12:00 AM" : hour < 12 ? `${hour}:00 AM` : hour === 12 ? "12:00 PM" : `${hour-12}:00 PM`}</div>
                    </div>
                    <div style={{ marginTop:12, display:"flex", gap:8, flexWrap:"wrap" }}>
                      <span style={S.badge(cl.color, cl.bg)}>⚡ {result.speedKmh} km/h</span>
                      <span style={S.badge("#38bdf8","rgba(56,189,248,0.12)")}>🎯 {result.conf}% confidence</span>
                    </div>
                  </div>
                </Glass>

                {/* Primary & secondary reasons */}
                <Glass style={{ padding:"24px 28px" }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:4 }}>🔍 Congestion Reason Breakdown</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:20 }}>
                    AI-identified contributing factors with weighted impact analysis
                  </div>
                  {result.normalized.map((r, i) => {
                    const barColors = ["#8b5cf6","#3b82f6","#06b6d4","#10b981"];
                    const bc = barColors[i] || "#6b7280";
                    return (
                      <div key={r.reason} style={{ marginBottom:16 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:16 }}>{r.icon}</span>
                            <div>
                              <div style={{ fontSize:13, fontWeight:700, color:"white" }}>
                                {i === 0 ? "🔴 Primary: " : i === 1 ? "🟡 Secondary: " : "⚪ "}{r.reason}
                              </div>
                            </div>
                          </div>
                          <span style={{ fontSize:14, fontWeight:800, color: bc }}>{r.contribution}%</span>
                        </div>
                        <div style={{ height:8, background:"rgba(255,255,255,0.06)", borderRadius:99, overflow:"hidden" }}>
                          <div style={{ width:`${r.contribution}%`, height:"100%", background:`linear-gradient(90deg,${bc},${bc}88)`, borderRadius:99, transition:"width 0.8s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </Glass>
              </div>

              {/* Right: AI summary + clearance */}
              <div style={{ flex:1, minWidth:280, display:"flex", flexDirection:"column", gap:20 }}>

                {/* AI written summary */}
                <Glass style={{ padding:"24px 28px", animation:"glow 4s ease infinite" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                    <span style={{ fontSize:20 }}>✨</span>
                    <div style={{ fontSize:15, fontWeight:700, color:"white" }}>AI Traffic Summary</div>
                  </div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.65)", lineHeight:1.8 }}>
                    {result.summary}
                  </div>
                  <div style={{ marginTop:16, padding:"10px 14px", background:"rgba(139,92,246,0.1)", border:"1px solid rgba(139,92,246,0.2)", borderRadius:10, fontSize:11, color:"rgba(255,255,255,0.45)" }}>
                    🤖 Generated by UrbanMind AI · {new Date().toLocaleTimeString()}
                  </div>
                </Glass>

                {/* Expected clearance timeline */}
                <Glass style={{ padding:"24px 28px" }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:16 }}>⏳ Expected Clearance</div>
                  {[
                    { label:"25% reduction",  time: Math.round(result.clearMinutes * 0.3), color:"#f59e0b" },
                    { label:"50% reduction",  time: Math.round(result.clearMinutes * 0.6), color:"#22c55e" },
                    { label:"Full clearance", time: result.clearMinutes, color:"#38bdf8" },
                  ].map(({ label, time, color }) => {
                    const eta = new Date(Date.now() + time * 60000);
                    return (
                      <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:"white" }}>{label}</div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>in ~{time} min</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:16, fontWeight:800, color }}>{eta.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
                        </div>
                      </div>
                    );
                  })}
                </Glass>

                {/* Weather impact */}
                <Glass style={{ padding:"24px 28px" }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:14 }}>{weather.emoji} Weather Impact</div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                    <span style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>Condition</span>
                    <span style={{ fontSize:13, fontWeight:700, color:"white" }}>{weather.label}</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                    <span style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>Added Delay</span>
                    <span style={{ fontSize:13, fontWeight:700, color:"#fb923c" }}>+{weather.delay} min</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
                    <span style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>Traffic Factor</span>
                    <span style={{ fontSize:13, fontWeight:700, color:"#a78bfa" }}>×{(1 + weather.factor).toFixed(2)}</span>
                  </div>
                  <div style={{ height:8, background:"rgba(255,255,255,0.06)", borderRadius:99, overflow:"hidden" }}>
                    <div style={{ width:`${Math.round(weather.factor * 100)}%`, height:"100%", background:"linear-gradient(90deg,#3b82f6,#8b5cf6)", borderRadius:99 }} />
                  </div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:6 }}>Weather severity: {Math.round(weather.factor * 100)}%</div>
                </Glass>
              </div>
            </div>

            {/* All roads comparison */}
            <Glass style={{ padding:"24px 28px" }}>
              <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:4 }}>🛣️ All Roads at a Glance — {DAYS[day]} {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour-12} PM`}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:20 }}>Sorted by congestion · click to analyze</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[...ROADS]
                  .map(r => {
                    const res = explainCongestion(r, weather, hour, day);
                    return { ...r, ...res };
                  })
                  .sort((a, b) => b.congestion - a.congestion)
                  .map((r, i) => {
                    const c = congColor(r.congestion);
                    const isSelected = r.name === road.name;
                    return (
                      <div key={r.name} onClick={() => { setRoad(ROADS.find(rd => rd.name === r.name)); analyze(); }}
                        style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderRadius:10,
                          background: isSelected ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.02)",
                          border:`1px solid ${isSelected ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.05)"}`,
                          cursor:"pointer", transition:"all 0.2s" }}>
                        <span style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.3)", minWidth:20 }}>{i+1}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight: isSelected ? 700 : 500, color:"white" }}>{r.name}</div>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
                            <div style={{ width:120, height:5, background:"rgba(255,255,255,0.08)", borderRadius:99 }}>
                              <div style={{ width:`${r.congestion}%`, height:"100%", background:c.color, borderRadius:99 }} />
                            </div>
                            <span style={{ fontSize:11, fontWeight:700, color:c.color }}>{r.congestion}%</span>
                          </div>
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, background:`${c.color}20`, color:c.color }}>{c.label}</span>
                      </div>
                    );
                  })}
              </div>
            </Glass>
          </div>
        )}

        {loading && (
          <div style={{ textAlign:"center", padding:"60px 0" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🧠</div>
            <div style={{ fontSize:18, fontWeight:700, color:"white", marginBottom:8 }}>Analyzing traffic patterns…</div>
            <div style={{ fontSize:14, color:"rgba(255,255,255,0.35)" }}>Running explainable AI model</div>
          </div>
        )}
      </div>
    </>
  );
}
