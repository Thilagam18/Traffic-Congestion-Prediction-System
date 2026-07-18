import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

const ROADS = [
  { name: "Market District Road",    baseLoad: 0.78, tag: "Commercial"  },
  { name: "Downtown Main Street",    baseLoad: 0.72, tag: "Urban core"  },
  { name: "Central Avenue",          baseLoad: 0.68, tag: "Arterial"    },
  { name: "East Highway I-42",       baseLoad: 0.65, tag: "Expressway"  },
  { name: "North Ring Road",         baseLoad: 0.58, tag: "Peripheral"  },
  { name: "Airport Link Highway",    baseLoad: 0.55, tag: "Transit"     },
  { name: "West Bridge Corridor",    baseLoad: 0.50, tag: "Bridge"      },
  { name: "South Bypass Expressway", baseLoad: 0.42, tag: "Bypass"      },
  { name: "Commerce Boulevard",      baseLoad: 0.48, tag: "Commercial"  },
  { name: "University Avenue",       baseLoad: 0.44, tag: "Residential" },
  { name: "Industrial Park Road",    baseLoad: 0.36, tag: "Industrial"  },
  { name: "Riverside Drive",         baseLoad: 0.30, tag: "Scenic"      },
];

const WEATHER_OPTIONS = [
  { id:"clear",  label:"Clear",     emoji:"☀️",  factor:0    },
  { id:"cloudy", label:"Cloudy",    emoji:"☁️",  factor:0.05 },
  { id:"rain",   label:"Rain",      emoji:"🌧️", factor:0.22 },
  { id:"fog",    label:"Fog",       emoji:"🌫️", factor:0.30 },
  { id:"storm",  label:"Storm",     emoji:"⛈️", factor:0.40 },
];

const WD_PROFILE = [
  0.08,0.06,0.05,0.05,0.07,0.14,0.30,0.80,0.95,0.72,0.56,0.52,
  0.58,0.54,0.50,0.55,0.66,0.92,0.88,0.64,0.46,0.36,0.22,0.13,
];
const WE_PROFILE = [
  0.05,0.04,0.04,0.04,0.05,0.08,0.14,0.22,0.34,0.48,0.58,0.64,
  0.68,0.65,0.61,0.58,0.54,0.48,0.42,0.35,0.27,0.20,0.13,0.08,
];

function predict(road, weather, hour, day, offsetMin) {
  const isWeekend = day === 0 || day === 6;
  const profile = isWeekend ? WE_PROFILE : WD_PROFILE;
  const h = Math.floor(((hour * 60 + offsetMin) / 60)) % 24;
  const frac = ((hour * 60 + offsetMin) % 60) / 60;
  const base = road.baseLoad * (profile[h] * (1 - frac) + profile[(h+1)%24] * frac);
  const noise = Math.sin(road.baseLoad * 7.3 + offsetMin * 0.05) * 0.03;
  const wFactor = weather.factor * 0.45;
  const cong = Math.min(98, Math.max(2, Math.round((base + noise + wFactor) * 100)));
  const speed = Math.round((1 - (cong / 100) * 0.88) * 110 + 8);
  const conf = Math.max(65, 97 - Math.round(offsetMin / 4) - (weather.factor * 15));
  return { cong, speed, h, frac, conf };
}

function congColor(v) {
  if (v >= 75) return { color:"#ef4444", label:"Severe",   bar:"#ef4444" };
  if (v >= 50) return { color:"#f97316", label:"High",     bar:"#f97316" };
  if (v >= 25) return { color:"#f59e0b", label:"Moderate", bar:"#f59e0b" };
  return              { color:"#22c55e", label:"Clear",    bar:"#22c55e" };
}

function fmtHour(h) {
  h = ((h % 24) + 24) % 24;
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h-12} PM`;
}

function Glass({ children, style={} }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.10)", borderRadius:16, backdropFilter:"blur(20px)", ...style }}>
      {children}
    </div>
  );
}

// Mini SVG line chart for 15/30/60 comparison
function PredictionChart({ dataPoints, width=600, height=180 }) {
  const [hover, setHover] = useState(null);
  const PAD = { top:20, right:20, bottom:40, left:44 };
  const cW = width - PAD.left - PAD.right;
  const cH = height - PAD.top - PAD.bottom;
  const n = dataPoints.length;
  const step = cW / (n - 1);

  const lineP = dataPoints.map((p,i) => `${PAD.left+i*step},${PAD.top+cH-(p.cong/100)*cH}`).join(" ");
  const areaP = `${PAD.left},${PAD.top+cH} ${lineP} ${PAD.left+(n-1)*step},${PAD.top+cH}`;

  const avgCong = Math.round(dataPoints.reduce((s,p)=>s+p.cong,0)/n);
  const lineColor = avgCong >= 75 ? "#ef4444" : avgCong >= 50 ? "#f97316" : avgCong >= 25 ? "#f59e0b" : "#22c55e";

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display:"block", maxWidth:"100%" }}>
      <defs>
        <linearGradient id="fpGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0,25,50,75,100].map(v => {
        const y = PAD.top + cH - (v/100)*cH;
        return (
          <g key={v}>
            <line x1={PAD.left} x2={PAD.left+cW} y1={y} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth={1} strokeDasharray={v>0?"4,4":""} />
            <text x={PAD.left-6} y={y+4} textAnchor="end" fontSize={10} fill="rgba(255,255,255,0.3)">{v}%</text>
          </g>
        );
      })}
      <polygon points={areaP} fill="url(#fpGrad)" />
      <polyline points={lineP} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinejoin="round" />
      {dataPoints.map((p,i) => {
        const cx = PAD.left + i * step;
        const cy = PAD.top + cH - (p.cong/100)*cH;
        const cl = congColor(p.cong);
        const isH = hover === i;
        return (
          <g key={i} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(null)} style={{cursor:"pointer"}}>
            <circle cx={cx} cy={cy} r={isH?7:4} fill={cl.color} stroke="white" strokeWidth={isH?2:1.5} />
            <text x={cx} y={height-8} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.4)">{p.label}</text>
            {isH && (
              <g>
                <rect x={cx-44} y={cy-62} width={88} height={54} rx={6} fill="#1e293b" />
                <text x={cx} y={cy-44} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.4)">{p.label}</text>
                <text x={cx} y={cy-28} textAnchor="middle" fontSize={13} fill="white" fontWeight={800}>{p.cong}%</text>
                <text x={cx} y={cy-13} textAnchor="middle" fontSize={9} fill={cl.color}>{cl.label}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function FuturePrediction() {
  const now = new Date();
  const [road, setRoad] = useState(ROADS[0]);
  const [weather, setWeather] = useState(WEATHER_OPTIONS[0]);
  const [day, setDay] = useState(now.getDay());
  const [baseHour, setBaseHour] = useState(now.getHours());
  const [results, setResults] = useState(null);

  function runForecast() {
    const horizons = [15, 30, 60];
    const preds = horizons.map(offsetMin => {
      const p = predict(road, weather, baseHour, day, offsetMin);
      return { offsetMin, ...p, cl: congColor(p.cong) };
    });
    // Dense chart: every 5 min for 60 min
    const chartPoints = Array.from({length:13}, (_, i) => {
      const off = i * 5;
      const p = predict(road, weather, baseHour, day, off);
      const mm = String(off % 60).padStart(2,'0');
      const hh = Math.floor((baseHour * 60 + off) / 60) % 24;
      return { ...p, label: off===0?"Now":`+${off}m` };
    });

    const factors = [
      { factor:"Time of Day",        icon:"⏰", impact: baseHour >= 7 && baseHour <= 9 ? "High" : baseHour >= 17 && baseHour <= 19 ? "High" : "Low", color:"#8b5cf6" },
      { factor:"Day Pattern",        icon:"📅", impact: (day===0||day===6) ? "Low (Weekend)" : "Normal", color:"#3b82f6" },
      { factor:"Weather Conditions", icon:weather.emoji, impact: weather.factor > 0.2 ? "High" : weather.factor > 0 ? "Moderate" : "None", color:"#06b6d4" },
      { factor:"Base Road Load",     icon:"🛣️", impact: `${Math.round(road.baseLoad*100)}% capacity`, color:"#10b981" },
      { factor:"Historical Pattern", icon:"📊", impact: "Integrated", color:"#f59e0b" },
    ];

    setResults({ preds, chartPoints, factors });
  }

  useEffect(() => { runForecast(); }, []);

  const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  const S = {
    page: { backgroundColor:"#0a0f1e", minHeight:"100vh", padding:"28px 32px", fontFamily:"system-ui,sans-serif" },
    label: { fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:6 },
    select: { width:"100%", padding:"10px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, fontSize:13, color:"white", outline:"none", cursor:"pointer" },
  };

  return (
    <>
      <Navbar />
      <style>{`select option { background:#1a1f2e; color:white; } @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={S.page}>
        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#3b82f6,#06b6d4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🔮</div>
            <div>
              <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:"white" }}>Future Traffic Prediction</h1>
              <p style={{ margin:"4px 0 0", color:"rgba(255,255,255,0.45)", fontSize:14 }}>15, 30, and 60-minute congestion forecasts with AI-driven factor analysis</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <Glass style={{ padding:"24px 28px", marginBottom:24 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"white", marginBottom:18 }}>🎛️ Forecast Parameters</div>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-end" }}>
            <div style={{ flex:2, minWidth:200 }}>
              <label style={S.label}>Road Segment</label>
              <select value={road.name} onChange={e=>setRoad(ROADS.find(r=>r.name===e.target.value))} style={S.select}>
                {ROADS.map(r=><option key={r.name} value={r.name}>{r.name} ({r.tag})</option>)}
              </select>
            </div>
            <div style={{ flex:1, minWidth:130 }}>
              <label style={S.label}>Weather</label>
              <select value={weather.id} onChange={e=>setWeather(WEATHER_OPTIONS.find(w=>w.id===e.target.value))} style={S.select}>
                {WEATHER_OPTIONS.map(w=><option key={w.id} value={w.id}>{w.emoji} {w.label}</option>)}
              </select>
            </div>
            <div style={{ flex:1, minWidth:130 }}>
              <label style={S.label}>Day</label>
              <select value={day} onChange={e=>setDay(Number(e.target.value))} style={S.select}>
                {DAYS.map((d,i)=><option key={i} value={i}>{d}{i===now.getDay()?" ★":""}</option>)}
              </select>
            </div>
            <div style={{ flex:1, minWidth:120 }}>
              <label style={S.label}>Start Hour</label>
              <select value={baseHour} onChange={e=>setBaseHour(Number(e.target.value))} style={S.select}>
                {Array.from({length:24},(_,h)=><option key={h} value={h}>{fmtHour(h)}{h===now.getHours()?" (now)":""}</option>)}
              </select>
            </div>
            <button onClick={runForecast} style={{ padding:"11px 28px", background:"linear-gradient(135deg,#3b82f6,#06b6d4)", color:"white", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 20px rgba(59,130,246,0.4)", whiteSpace:"nowrap" }}>
              🔮 Run Forecast
            </button>
          </div>
        </Glass>

        {results && (
          <div style={{ animation:"fadeUp 0.5s ease" }}>
            {/* 15 / 30 / 60 min cards */}
            <div style={{ display:"flex", gap:16, marginBottom:24, flexWrap:"wrap" }}>
              {results.preds.map(p => {
                const eta = new Date(Date.now() + p.offsetMin * 60000);
                const etaStr = eta.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
                return (
                  <Glass key={p.offsetMin} style={{ flex:1, minWidth:200, padding:"28px 24px", textAlign:"center", border:`1px solid ${p.cl.color}30` }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.45)", marginBottom:12 }}>In {p.offsetMin} Minutes</div>
                    <div style={{ fontSize:48, fontWeight:900, color:p.cl.color, lineHeight:1 }}>{p.cong}%</div>
                    <div style={{ fontSize:14, fontWeight:700, color:p.cl.color, marginTop:6, marginBottom:16 }}>{p.cl.label}</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)" }}>⚡ {p.speed} km/h avg speed</div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)" }}>🕐 Around {etaStr}</div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)" }}>🎯 {p.conf}% confidence</div>
                    </div>
                    <div style={{ marginTop:16, height:6, background:"rgba(255,255,255,0.06)", borderRadius:99 }}>
                      <div style={{ width:`${p.cong}%`, height:"100%", background:p.cl.color, borderRadius:99, transition:"width 0.8s" }} />
                    </div>
                  </Glass>
                );
              })}
            </div>

            {/* Chart */}
            <Glass style={{ padding:"24px 28px", marginBottom:24 }}>
              <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:4 }}>📈 60-Minute Congestion Forecast — {road.name}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:20 }}>Every 5 minutes · hover for details</div>
              <PredictionChart dataPoints={results.chartPoints} />
            </Glass>

            {/* Prediction factors + all roads */}
            <div style={{ display:"flex", gap:20, marginBottom:24, flexWrap:"wrap" }}>
              <Glass style={{ flex:1, minWidth:280, padding:"24px 28px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:16 }}>🧬 Prediction Factors</div>
                {results.factors.map(f => (
                  <div key={f.factor} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:18 }}>{f.icon}</span>
                      <span style={{ fontSize:13, color:"rgba(255,255,255,0.65)" }}>{f.factor}</span>
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:f.color, padding:"3px 10px", background:`${f.color}18`, borderRadius:99 }}>{f.impact}</span>
                  </div>
                ))}
              </Glass>

              <Glass style={{ flex:2, minWidth:300, padding:"24px 28px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:4 }}>🛣️ All Roads — 15 / 30 / 60 Min Comparison</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:16 }}>Sorted by current congestion</div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                    <thead>
                      <tr>
                        {["Road","Now","+ 15 min","+ 30 min","+ 60 min","Trend"].map(h => (
                          <th key={h} style={{ padding:"8px 10px", textAlign:"left", color:"rgba(255,255,255,0.35)", fontWeight:600, fontSize:10, textTransform:"uppercase", borderBottom:"1px solid rgba(255,255,255,0.07)", whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...ROADS].map(r => {
                        const now0 = predict(r, weather, baseHour, day, 0);
                        const p15  = predict(r, weather, baseHour, day, 15);
                        const p30  = predict(r, weather, baseHour, day, 30);
                        const p60  = predict(r, weather, baseHour, day, 60);
                        const trend = p60.cong > now0.cong + 5 ? "📈 Rising" : p60.cong < now0.cong - 5 ? "📉 Easing" : "➡️ Stable";
                        return (
                          <tr key={r.name} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                            <td style={{ padding:"10px 10px", color:"rgba(255,255,255,0.7)", fontWeight:500 }}>{r.name.split(" ").slice(0,2).join(" ")}</td>
                            {[now0, p15, p30, p60].map((p, i) => {
                              const c = congColor(p.cong);
                              return <td key={i} style={{ padding:"10px 10px" }}><span style={{ color:c.color, fontWeight:700 }}>{p.cong}%</span></td>;
                            })}
                            <td style={{ padding:"10px 10px", fontSize:11, color:"rgba(255,255,255,0.45)", whiteSpace:"nowrap" }}>{trend}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Glass>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
