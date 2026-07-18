import React, { useState } from "react";
import Navbar from "../components/Navbar";

function Glass({ children, style = {} }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.10)", borderRadius:16, backdropFilter:"blur(20px)", ...style }}>
      {children}
    </div>
  );
}

const WEATHER_OPTIONS = [
  { id:"clear", label:"Clear", emoji:"☀️", factor:0 },
  { id:"rain",  label:"Rain",  emoji:"🌧️", factor:0.22 },
  { id:"fog",   label:"Fog",   emoji:"🌫️", factor:0.30 },
  { id:"storm", label:"Storm", emoji:"⛈️", factor:0.40 },
];

function generateRoutes(origin, destination, weather) {
  if (!origin || !destination) return [];
  const seed = (origin + destination).split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const rng = (n) => ((seed * n * 9301 + 49297) % 233280) / 233280;

  const now = new Date();
  const hour = now.getHours();
  const isRush = (hour>=7&&hour<=9)||(hour>=17&&hour<=19);
  const wf = weather.factor;

  return [
    {
      name: "Recommended Route",
      type: "optimal",
      via: "Central Avenue → North Ring Road",
      distKm: 12.4 + rng(1)*5,
      baseMinutes: 18 + rng(2)*8,
      congestion: Math.round((0.32 + rng(3)*0.20 + wf*0.3) * 100),
      fuelL: 1.1 + rng(4)*0.4,
      safetyScore: 88 + Math.round(rng(5)*8),
      ai: "Optimal balance of distance, traffic flow, and safety. Best choice under current conditions.",
      color: "#22c55e",
      icon: "🟢",
    },
    {
      name: "Fastest Route",
      type: "fastest",
      via: "East Highway I-42 → Expressway",
      distKm: 14.8 + rng(6)*4,
      baseMinutes: 15 + rng(7)*6,
      congestion: Math.round((0.55 + rng(8)*0.25 + (isRush?0.15:0) + wf*0.35) * 100),
      fuelL: 1.4 + rng(9)*0.5,
      safetyScore: 76 + Math.round(rng(10)*10),
      ai: "Fastest under low traffic but heavily affected by rush hour. High fuel consumption on expressway.",
      color: "#3b82f6",
      icon: "🔵",
    },
    {
      name: "Eco-Friendly Route",
      type: "eco",
      via: "Riverside Drive → Commerce Boulevard",
      distKm: 11.2 + rng(11)*3,
      baseMinutes: 24 + rng(12)*10,
      congestion: Math.round((0.28 + rng(13)*0.18 + wf*0.2) * 100),
      fuelL: 0.9 + rng(14)*0.3,
      safetyScore: 82 + Math.round(rng(15)*12),
      ai: "Lowest fuel and CO₂ output. Longer travel time but ideal for environmental priority.",
      color: "#10b981",
      icon: "🌿",
    },
    {
      name: "Safest Route",
      type: "safest",
      via: "University Avenue → South Bypass",
      distKm: 15.6 + rng(16)*6,
      baseMinutes: 28 + rng(17)*12,
      congestion: Math.round((0.22 + rng(18)*0.15 + wf*0.18) * 100),
      fuelL: 1.3 + rng(19)*0.4,
      safetyScore: 93 + Math.round(rng(20)*5),
      ai: "Highest road safety score. Wide lanes, good lighting, low accident history. Best for night driving or bad weather.",
      color: "#f59e0b",
      icon: "🛡️",
    },
  ].map(r => {
    const wDelay = r.congestion > 60 ? 1.4 : r.congestion > 35 ? 1.2 : 1.0;
    const etaMin = Math.round(r.baseMinutes * wDelay);
    const co2g = Math.round(r.fuelL * 2310); // g CO₂ per litre petrol
    const co2 = co2g >= 1000 ? `${(co2g/1000).toFixed(2)} kg` : `${co2g} g`;
    r.etaMin = etaMin;
    r.co2 = co2;
    r.co2g = co2g;
    r.distKm = parseFloat(r.distKm.toFixed(1));
    r.fuelL = parseFloat(r.fuelL.toFixed(2));
    return r;
  });
}

function ScoreBar({ value, max=100, color, width=80 }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <div style={{ width, height:6, background:"rgba(255,255,255,0.08)", borderRadius:99 }}>
        <div style={{ width:`${(value/max)*100}%`, height:"100%", background:color, borderRadius:99, transition:"width 0.8s ease" }} />
      </div>
      <span style={{ fontSize:11, fontWeight:700, color, minWidth:30 }}>{value}</span>
    </div>
  );
}

export default function RouteComparison() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [weather, setWeather] = useState(WEATHER_OPTIONS[0]);
  const [routes, setRoutes] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  function compare() {
    if (!origin.trim() || !destination.trim()) { setError("Please enter both origin and destination."); return; }
    setError("");
    const r = generateRoutes(origin.trim(), destination.trim(), weather);
    setRoutes(r);
    setSelected(r[0]);
  }

  const S = {
    page: { backgroundColor:"#0a0f1e", minHeight:"100vh", padding:"28px 32px", fontFamily:"system-ui,sans-serif" },
    label: { fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:6 },
    input: { width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, fontSize:13, color:"white", outline:"none", boxSizing:"border-box" },
    select: { width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, fontSize:13, color:"white", outline:"none", cursor:"pointer" },
  };

  const metrics = selected ? [
    { label:"Distance",       value:`${selected.distKm} km`,               icon:"📏", color:"#38bdf8" },
    { label:"ETA",            value:`${selected.etaMin} min`,              icon:"⏱️", color:"#a78bfa" },
    { label:"Congestion",     value:`${selected.congestion}%`,             icon:"🚦", color: selected.congestion>=75?"#ef4444":selected.congestion>=50?"#f97316":selected.congestion>=25?"#f59e0b":"#22c55e" },
    { label:"Fuel Estimate",  value:`${selected.fuelL} L`,                 icon:"⛽", color:"#f59e0b" },
    { label:"CO₂ Emission",   value:selected.co2,                          icon:"🌿", color:"#4ade80" },
    { label:"Safety Score",   value:`${selected.safetyScore}/100`,         icon:"🛡️", color:"#f472b6" },
  ] : [];

  return (
    <>
      <Navbar />
      <style>{`input::placeholder{color:rgba(255,255,255,0.25)} select option{background:#1a1f2e;color:white} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={S.page}>
        <div style={{ marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#f59e0b,#ef4444)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🔀</div>
            <div>
              <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:"white" }}>Route Comparison</h1>
              <p style={{ margin:"4px 0 0", color:"rgba(255,255,255,0.45)", fontSize:14 }}>Compare routes by distance, ETA, congestion, fuel, CO₂, and safety</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <Glass style={{ padding:"24px 28px", marginBottom:24 }}>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-end" }}>
            <div style={{ flex:2, minWidth:200 }}>
              <label style={S.label}>📍 Origin</label>
              <input value={origin} onChange={e=>setOrigin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&compare()} placeholder="e.g. Downtown Main Street" style={S.input} />
            </div>
            <div style={{ flex:2, minWidth:200 }}>
              <label style={S.label}>🏁 Destination</label>
              <input value={destination} onChange={e=>setDestination(e.target.value)} onKeyDown={e=>e.key==="Enter"&&compare()} placeholder="e.g. Airport Terminal 2" style={S.input} />
            </div>
            <div style={{ flex:1, minWidth:130 }}>
              <label style={S.label}>Weather</label>
              <select value={weather.id} onChange={e=>setWeather(WEATHER_OPTIONS.find(w=>w.id===e.target.value))} style={S.select}>
                {WEATHER_OPTIONS.map(w=><option key={w.id} value={w.id}>{w.emoji} {w.label}</option>)}
              </select>
            </div>
            <button onClick={compare} style={{ padding:"12px 28px", background:"linear-gradient(135deg,#f59e0b,#ef4444)", color:"white", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 20px rgba(245,158,11,0.4)", whiteSpace:"nowrap" }}>
              🔀 Compare Routes
            </button>
          </div>
          {error && <div style={{ marginTop:12, padding:"10px 14px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, color:"#f87171", fontSize:13 }}>⚠️ {error}</div>}
        </Glass>

        {routes && (
          <div style={{ animation:"fadeUp 0.5s ease" }}>
            {/* Route cards */}
            <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
              {routes.map(r => (
                <div key={r.type} onClick={()=>setSelected(r)} style={{ flex:1, minWidth:200, cursor:"pointer" }}>
                  <Glass style={{ padding:"20px 22px", border:`1px solid ${selected?.type===r.type ? r.color+"50" : "rgba(255,255,255,0.10)"}`, background: selected?.type===r.type ? `${r.color}10` : "rgba(255,255,255,0.04)", transition:"all 0.2s" }}>
                    <div style={{ fontSize:22, marginBottom:8 }}>{r.icon}</div>
                    <div style={{ fontSize:15, fontWeight:800, color:r.color, marginBottom:4 }}>{r.name}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:14 }}>via {r.via}</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>ETA</span>
                        <span style={{ fontSize:12, fontWeight:700, color:"white" }}>{r.etaMin} min</span>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Congestion</span>
                        <span style={{ fontSize:12, fontWeight:700, color: r.congestion>=75?"#ef4444":r.congestion>=50?"#f97316":r.congestion>=25?"#f59e0b":"#22c55e" }}>{r.congestion}%</span>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Safety</span>
                        <span style={{ fontSize:12, fontWeight:700, color:"#f472b6" }}>{r.safetyScore}/100</span>
                      </div>
                    </div>
                    {selected?.type===r.type && <div style={{ marginTop:14, padding:"6px 10px", background:`${r.color}20`, borderRadius:8, fontSize:11, color:r.color, fontWeight:700 }}>✓ Selected</div>}
                  </Glass>
                </div>
              ))}
            </div>

            {/* Selected route details */}
            {selected && (
              <div style={{ display:"flex", gap:20, marginBottom:24, flexWrap:"wrap" }}>
                {/* Metrics */}
                <Glass style={{ flex:2, minWidth:300, padding:"24px 28px" }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:4 }}>{selected.icon} {selected.name} — Full Analysis</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:20 }}>via {selected.via}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16 }}>
                    {metrics.map(m => (
                      <div key={m.label} style={{ padding:"16px 18px", background:"rgba(255,255,255,0.03)", border:`1px solid ${m.color}20`, borderRadius:12 }}>
                        <div style={{ fontSize:18, marginBottom:6 }}>{m.icon}</div>
                        <div style={{ fontSize:22, fontWeight:800, color:m.color }}>{m.value}</div>
                        <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginTop:4 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </Glass>

                {/* AI Recommendation */}
                <Glass style={{ flex:1, minWidth:260, padding:"24px 28px" }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:16 }}>✨ AI Recommendation</div>
                  <div style={{ width:60, height:60, borderRadius:16, background:`linear-gradient(135deg,${selected.color},${selected.color}88)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, marginBottom:16 }}>
                    {selected.icon}
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, color:selected.color, marginBottom:10 }}>{selected.name}</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:1.7, marginBottom:20 }}>{selected.ai}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    <div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginBottom:4 }}>Safety Score</div>
                      <ScoreBar value={selected.safetyScore} color="#f472b6" width={140} />
                    </div>
                    <div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginBottom:4 }}>Congestion Level</div>
                      <ScoreBar value={selected.congestion} color={selected.congestion>=75?"#ef4444":selected.congestion>=50?"#f97316":"#22c55e"} width={140} />
                    </div>
                  </div>
                </Glass>
              </div>
            )}

            {/* Comparison table */}
            <Glass style={{ padding:"24px 28px" }}>
              <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:16 }}>📊 Side-by-Side Comparison</div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr>
                      <th style={{ padding:"10px 14px", textAlign:"left", color:"rgba(255,255,255,0.35)", fontSize:11, textTransform:"uppercase", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>Metric</th>
                      {routes.map(r => <th key={r.type} style={{ padding:"10px 14px", textAlign:"center", color:r.color, fontSize:12, fontWeight:700, borderBottom:"1px solid rgba(255,255,255,0.07)" }}>{r.icon} {r.name.split(" ")[0]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label:"Distance",     vals: routes.map(r=>`${r.distKm} km`),                 best:routes.reduce((b,r)=>r.distKm<b.distKm?r:b,routes[0]).type },
                      { label:"ETA",          vals: routes.map(r=>`${r.etaMin} min`),                best:routes.reduce((b,r)=>r.etaMin<b.etaMin?r:b,routes[0]).type },
                      { label:"Congestion",   vals: routes.map(r=>`${r.congestion}%`),               best:routes.reduce((b,r)=>r.congestion<b.congestion?r:b,routes[0]).type },
                      { label:"Fuel",         vals: routes.map(r=>`${r.fuelL} L`),                   best:routes.reduce((b,r)=>r.fuelL<b.fuelL?r:b,routes[0]).type },
                      { label:"CO₂",          vals: routes.map(r=>r.co2),                            best:routes.reduce((b,r)=>r.co2g<b.co2g?r:b,routes[0]).type },
                      { label:"Safety Score", vals: routes.map(r=>`${r.safetyScore}/100`),           best:routes.reduce((b,r)=>r.safetyScore>b.safetyScore?r:b,routes[0]).type },
                    ].map(row => (
                      <tr key={row.label} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding:"12px 14px", color:"rgba(255,255,255,0.45)", fontWeight:600, fontSize:12 }}>{row.label}</td>
                        {routes.map((r,i) => (
                          <td key={r.type} style={{ padding:"12px 14px", textAlign:"center" }}>
                            <span style={{ fontSize:13, fontWeight:700, color: r.type===row.best ? "#22c55e" : "rgba(255,255,255,0.65)" }}>
                              {row.vals[i]} {r.type===row.best && "✓"}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Glass>
          </div>
        )}
      </div>
    </>
  );
}
