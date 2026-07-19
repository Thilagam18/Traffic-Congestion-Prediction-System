import React, { useState } from "react";

function Glass({ children, style = {} }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.10)", borderRadius:16, backdropFilter:"blur(20px)", ...style }}>
      {children}
    </div>
  );
}

const ROADS = [
  { name:"Market District Road",    tag:"Commercial",  accidents:12, weather:0.7, roadCond:0.6, density:0.78, construction:true,  visibility:0.8 },
  { name:"Downtown Main Street",    tag:"Urban core",  accidents:9,  weather:0.6, roadCond:0.7, density:0.72, construction:false, visibility:0.85 },
  { name:"Central Avenue",          tag:"Arterial",    accidents:7,  weather:0.5, roadCond:0.75, density:0.68, construction:false, visibility:0.9 },
  { name:"East Highway I-42",       tag:"Expressway",  accidents:15, weather:0.4, roadCond:0.85, density:0.65, construction:true,  visibility:0.7 },
  { name:"North Ring Road",         tag:"Peripheral",  accidents:4,  weather:0.3, roadCond:0.8, density:0.58, construction:false, visibility:0.92 },
  { name:"Airport Link Highway",    tag:"Transit",     accidents:5,  weather:0.35, roadCond:0.88, density:0.55, construction:false, visibility:0.88 },
  { name:"West Bridge Corridor",    tag:"Bridge",      accidents:6,  weather:0.65, roadCond:0.65, density:0.50, construction:false, visibility:0.75 },
  { name:"South Bypass Expressway", tag:"Bypass",      accidents:3,  weather:0.25, roadCond:0.9, density:0.42, construction:false, visibility:0.95 },
  { name:"Commerce Boulevard",      tag:"Commercial",  accidents:8,  weather:0.55, roadCond:0.7, density:0.48, construction:true,  visibility:0.82 },
  { name:"University Avenue",       tag:"Residential", accidents:2,  weather:0.2, roadCond:0.85, density:0.44, construction:false, visibility:0.93 },
  { name:"Industrial Park Road",    tag:"Industrial",  accidents:10, weather:0.45, roadCond:0.6, density:0.36, construction:true,  visibility:0.78 },
  { name:"Riverside Drive",         tag:"Scenic",      accidents:1,  weather:0.15, roadCond:0.92, density:0.30, construction:false, visibility:0.96 },
];

function computeSafety(road, weatherSel) {
  const accidentScore = Math.max(0, 100 - road.accidents * 4.5);
  const weatherScore  = Math.round((1 - road.weather * weatherSel) * 100);
  const condScore     = Math.round(road.roadCond * 100);
  const densityScore  = Math.round((1 - road.density * 0.7) * 100);
  const constrScore   = road.construction ? 55 : 100;
  const visScore      = Math.round(road.visibility * 100);

  const weights = { accident:0.30, weather:0.18, condition:0.20, density:0.15, construction:0.10, visibility:0.07 };
  const overall = Math.round(
    accidentScore * weights.accident +
    weatherScore  * weights.weather  +
    condScore     * weights.condition +
    densityScore  * weights.density  +
    constrScore   * weights.construction +
    visScore      * weights.visibility
  );

  return {
    overall,
    breakdown: [
      { label:"Accident History",   score:Math.round(accidentScore), icon:"🚨", weight:weights.accident, desc:`${road.accidents} incidents/month` },
      { label:"Weather Resilience", score:weatherScore,              icon:"🌦️", weight:weights.weather,  desc:"Current weather impact" },
      { label:"Road Condition",     score:condScore,                 icon:"🛣️", weight:weights.condition, desc:"Surface quality rating" },
      { label:"Traffic Density",    score:densityScore,              icon:"🚗", weight:weights.density,  desc:"Vehicle volume impact" },
      { label:"Construction",       score:constrScore,               icon:"🏗️", weight:weights.construction, desc: road.construction ? "Active works" : "No construction" },
      { label:"Visibility",         score:visScore,                  icon:"👁️", weight:weights.visibility, desc:"Sight distance score" },
    ],
  };
}

function safetyColor(score) {
  if (score >= 80) return { color:"#22c55e", label:"Safe",     bg:"rgba(34,197,94,0.12)"  };
  if (score >= 60) return { color:"#f59e0b", label:"Caution",  bg:"rgba(245,158,11,0.12)" };
  if (score >= 40) return { color:"#f97316", label:"Risky",    bg:"rgba(249,115,22,0.12)" };
  return              { color:"#ef4444", label:"Dangerous", bg:"rgba(239,68,68,0.12)"  };
}

const WEATHER_OPTS = [
  { id:"clear", label:"Clear ☀️",   factor:0.0 },
  { id:"rain",  label:"Rain 🌧️",   factor:0.6 },
  { id:"fog",   label:"Fog 🌫️",   factor:0.8 },
  { id:"storm", label:"Storm ⛈️", factor:1.0 },
];

export default function RoadSafetyIndex() {
  const [weatherFactor, setWeatherFactor] = useState(0);
  const [selected, setSelected] = useState(ROADS[0]);
  const [sortBy, setSortBy] = useState("overall");

  const computed = ROADS.map(r => ({ ...r, ...computeSafety(r, weatherFactor) }));
  const sorted = [...computed].sort((a,b) => sortBy === "overall" ? b.overall - a.overall : a.name.localeCompare(b.name));
  const selResult = computed.find(r => r.name === selected.name);

  const S = {
    page: { backgroundColor:"#0a0f1e", minHeight:"100vh", padding:"28px 32px", fontFamily:"system-ui,sans-serif" },
    label: { fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:"0.08em" },
    select: { padding:"9px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, fontSize:13, color:"white", outline:"none", cursor:"pointer" },
  };

  return (
    <>
      
      <style>{`select option{background:#1a1f2e;color:white} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={S.page}>
        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#f59e0b,#ef4444)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🛡️</div>
            <div>
              <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:"white" }}>Road Safety Index</h1>
              <p style={{ margin:"4px 0 0", color:"rgba(255,255,255,0.45)", fontSize:14 }}>AI-generated safety scores based on accident history, weather, road condition, and more</p>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:16, marginTop:16 }}>
            <span style={S.label}>Weather:</span>
            {WEATHER_OPTS.map(w => (
              <button key={w.id} onClick={()=>setWeatherFactor(w.factor)} style={{ padding:"7px 16px", borderRadius:8, border:`1px solid ${weatherFactor===w.factor?"rgba(245,158,11,0.6)":"rgba(255,255,255,0.12)"}`, background:weatherFactor===w.factor?"rgba(245,158,11,0.15)":"transparent", color:weatherFactor===w.factor?"#f59e0b":"rgba(255,255,255,0.5)", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                {w.label}
              </button>
            ))}
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
              <span style={S.label}>Sort:</span>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={S.select}>
                <option value="overall">By Safety Score</option>
                <option value="name">By Name</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
          {/* Left: road list */}
          <div style={{ flex:1, minWidth:280 }}>
            <Glass style={{ overflow:"hidden" }}>
              <div style={{ padding:"18px 22px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize:14, fontWeight:700, color:"white" }}>🛣️ All Road Safety Scores</div>
              </div>
              <div style={{ maxHeight:600, overflowY:"auto" }}>
                {sorted.map((r, i) => {
                  const c = safetyColor(r.overall);
                  const isSelected = r.name === selected.name;
                  return (
                    <div key={r.name} onClick={()=>setSelected(ROADS.find(rd=>rd.name===r.name))}
                      style={{ padding:"14px 22px", cursor:"pointer", borderBottom:"1px solid rgba(255,255,255,0.04)",
                        background:isSelected?"rgba(245,158,11,0.08)":"transparent", transition:"background 0.2s" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <div>
                          <span style={{ fontSize:12, color:"rgba(255,255,255,0.25)", marginRight:8 }}>#{i+1}</span>
                          <span style={{ fontSize:13, fontWeight:700, color:"white" }}>{r.name}</span>
                        </div>
                        <span style={{ fontSize:14, fontWeight:800, color:c.color }}>{r.overall}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ flex:1, height:6, background:"rgba(255,255,255,0.06)", borderRadius:99 }}>
                          <div style={{ width:`${r.overall}%`, height:"100%", background:c.color, borderRadius:99, transition:"width 0.6s ease" }} />
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99, background:c.bg, color:c.color }}>{c.label}</span>
                        {r.construction && <span style={{ fontSize:11 }}>🏗️</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Glass>
          </div>

          {/* Right: detail */}
          {selResult && (
            <div style={{ flex:2, minWidth:340, display:"flex", flexDirection:"column", gap:20, animation:"fadeUp 0.4s ease" }}>
              {/* Score ring + top stats */}
              <Glass style={{ padding:"28px" }}>
                <div style={{ display:"flex", gap:24, alignItems:"center", flexWrap:"wrap" }}>
                  {/* Big score */}
                  <div style={{ textAlign:"center", minWidth:120 }}>
                    {(() => {
                      const c = safetyColor(selResult.overall);
                      const r=50,cx=64,cy=64,sw=10;
                      const circ=2*Math.PI*r, dash=(selResult.overall/100)*circ;
                      return (
                        <svg width={128} height={128}>
                          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw}/>
                          <circle cx={cx} cy={cy} r={r} fill="none" stroke={c.color} strokeWidth={sw}
                            strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
                            transform={`rotate(-90 ${cx} ${cy})`} style={{transition:"stroke-dasharray 0.8s ease"}}/>
                          <text x={cx} y={cy-4} textAnchor="middle" fontSize={22} fontWeight={800} fill="white">{selResult.overall}</text>
                          <text x={cx} y={cy+14} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.4)">/ 100</text>
                        </svg>
                      );
                    })()}
                    <div style={{ fontSize:14, fontWeight:800, color:safetyColor(selResult.overall).color, marginTop:4 }}>{safetyColor(selResult.overall).label}</div>
                  </div>
                  <div style={{ flex:1, minWidth:180 }}>
                    <div style={{ fontSize:20, fontWeight:800, color:"white", marginBottom:6 }}>{selResult.name}</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:14 }}>{selResult.tag}</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                      <span style={{ padding:"5px 12px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, fontSize:12, color:"#f87171" }}>🚨 {selResult.accidents} accidents/mo</span>
                      {selResult.construction && <span style={{ padding:"5px 12px", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:8, fontSize:12, color:"#fbbf24" }}>🏗️ Construction Active</span>}
                      <span style={{ padding:"5px 12px", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, fontSize:12, color:"#4ade80" }}>👁️ {Math.round(selResult.visibility*100)}% visibility</span>
                    </div>
                  </div>
                </div>
              </Glass>

              {/* Factor breakdown */}
              <Glass style={{ padding:"24px 28px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:20 }}>📊 Safety Factor Breakdown</div>
                {selResult.breakdown.map(f => {
                  const c = safetyColor(f.score);
                  return (
                    <div key={f.label} style={{ marginBottom:18 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:16 }}>{f.icon}</span>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, color:"white" }}>{f.label}</div>
                            <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{f.desc} · weight {Math.round(f.weight*100)}%</div>
                          </div>
                        </div>
                        <span style={{ fontSize:16, fontWeight:800, color:c.color }}>{f.score}</span>
                      </div>
                      <div style={{ height:8, background:"rgba(255,255,255,0.06)", borderRadius:99 }}>
                        <div style={{ width:`${f.score}%`, height:"100%", background:`linear-gradient(90deg,${c.color},${c.color}88)`, borderRadius:99, transition:"width 0.8s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </Glass>

              {/* Network summary */}
              <Glass style={{ padding:"24px 28px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:16 }}>📈 Network Safety Summary</div>
                <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                  {[
                    { label:"Safe (80+)",     count:computed.filter(r=>r.overall>=80).length, color:"#22c55e" },
                    { label:"Caution (60-79)",count:computed.filter(r=>r.overall>=60&&r.overall<80).length, color:"#f59e0b" },
                    { label:"Risky (40-59)",  count:computed.filter(r=>r.overall>=40&&r.overall<60).length, color:"#f97316" },
                    { label:"Dangerous (<40)",count:computed.filter(r=>r.overall<40).length, color:"#ef4444" },
                  ].map(s => (
                    <div key={s.label} style={{ flex:1, minWidth:100, padding:"16px", background:`${s.color}10`, border:`1px solid ${s.color}25`, borderRadius:12, textAlign:"center" }}>
                      <div style={{ fontSize:28, fontWeight:900, color:s.color }}>{s.count}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </Glass>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
