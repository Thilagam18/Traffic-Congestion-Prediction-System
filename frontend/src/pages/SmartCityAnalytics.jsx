import React, { useState, useEffect } from "react";

function Glass({ children, style = {} }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.10)", borderRadius:16, backdropFilter:"blur(20px)", ...style }}>
      {children}
    </div>
  );
}

const ROADS = [
  { name:"Market District", zone:"Commercial",  baseLoad:0.78, lat:12.97, lon:77.59 },
  { name:"Downtown Main",   zone:"Urban core",  baseLoad:0.72, lat:12.98, lon:77.60 },
  { name:"Central Avenue",  zone:"Arterial",    baseLoad:0.68, lat:12.96, lon:77.58 },
  { name:"East Highway",    zone:"Expressway",  baseLoad:0.65, lat:12.99, lon:77.62 },
  { name:"North Ring Road", zone:"Peripheral",  baseLoad:0.58, lat:13.01, lon:77.56 },
  { name:"Airport Link",    zone:"Transit",     baseLoad:0.55, lat:13.00, lon:77.61 },
  { name:"West Bridge",     zone:"Bridge",      baseLoad:0.50, lat:12.95, lon:77.55 },
  { name:"South Bypass",    zone:"Bypass",      baseLoad:0.42, lat:12.94, lon:77.57 },
];

const HOUR_PROFILE_WD = [
  0.08,0.05,0.04,0.04,0.06,0.14,0.30,0.80,0.95,0.72,0.56,0.52,
  0.58,0.54,0.50,0.55,0.66,0.92,0.88,0.64,0.46,0.36,0.22,0.13,
];

const HOUR_PROFILE_WE = [
  0.05,0.04,0.03,0.03,0.05,0.08,0.14,0.22,0.34,0.48,0.58,0.64,
  0.68,0.65,0.61,0.58,0.54,0.48,0.42,0.35,0.27,0.20,0.13,0.08,
];

function cong(road, hour, isWeekend) {
  const profile = isWeekend ? HOUR_PROFILE_WE : HOUR_PROFILE_WD;
  const v = road.baseLoad * profile[hour] + Math.sin(road.baseLoad * 7.3 + hour * 0.4) * 0.03;
  return Math.min(98, Math.max(2, Math.round(v * 100)));
}

function congColor(v) {
  if (v >= 75) return "#ef4444";
  if (v >= 50) return "#f97316";
  if (v >= 25) return "#f59e0b";
  return "#22c55e";
}

// Generate weekly trends (7 days × 24 hours compressed to daily peaks)
const WEEKLY_DATA = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day, d) => {
  const isWE = d >= 5;
  const profile = isWE ? HOUR_PROFILE_WE : HOUR_PROFILE_WD;
  const avg = Math.round(profile.reduce((s,v)=>s+v,0)/24 * 72);
  const peak = Math.round(Math.max(...profile) * 72 + 8);
  const incidents = isWE ? Math.floor(Math.random()*3+1) : Math.floor(Math.random()*6+2);
  const vehicles = Math.round((avg/100)*18500 + Math.random()*1200);
  return { day, avg, peak, incidents, vehicles };
});

// Accident hotspots
const HOTSPOTS = [
  { road:"Market District", count:12, lat:12.97, lon:77.59, risk:"High"   },
  { road:"East Highway",    count:15, lat:12.99, lon:77.62, risk:"High"   },
  { road:"Downtown Main",   count:9,  lat:12.98, lon:77.60, risk:"Medium" },
  { road:"West Bridge",     count:6,  lat:12.95, lon:77.55, risk:"Medium" },
  { road:"North Ring Road", count:4,  lat:13.01, lon:77.56, risk:"Low"    },
];

// Heatmap cell component
function HeatCell({ value, max, label }) {
  const pct = value / max;
  const r = Math.round(pct * 239 + 16);
  const g = Math.round((1-pct) * 199 + 16);
  const b = 16;
  return (
    <div style={{ background:`rgba(${r},${g},${b},0.7)`, borderRadius:4, padding:"4px 2px", textAlign:"center", cursor:"default" }} title={`${label}: ${value}%`}>
      <span style={{ fontSize:9, color:"white", fontWeight:700 }}>{value}%</span>
    </div>
  );
}

// Bar chart
function BarChart({ data, height=120 }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:4, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
          <span style={{ fontSize:9, color:"rgba(255,255,255,0.35)", marginBottom:2 }}>{d.value}</span>
          <div style={{ width:"100%", height:`${(d.value/max)*height}px`, background: d.color || "linear-gradient(180deg,#3b82f6,#8b5cf6)", borderRadius:"4px 4px 0 0", transition:"height 0.6s ease" }} />
          <span style={{ fontSize:9, color:"rgba(255,255,255,0.35)", whiteSpace:"nowrap" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Line SVG chart
function LineChart({ dataPoints, color="#3b82f6", height=80 }) {
  if (dataPoints.length < 2) return null;
  const W=300, H=height, PAD={top:8,right:8,bottom:20,left:32};
  const cW=W-PAD.left-PAD.right, cH=H-PAD.top-PAD.bottom;
  const max=Math.max(...dataPoints.map(d=>d.value),1);
  const step=cW/(dataPoints.length-1);
  const pts=dataPoints.map((d,i)=>`${PAD.left+i*step},${PAD.top+cH-(d.value/max)*cH}`).join(" ");
  const area=`${PAD.left},${PAD.top+cH} ${pts} ${PAD.left+(dataPoints.length-1)*step},${PAD.top+cH}`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      <defs><linearGradient id="lcGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
        <stop offset="100%" stopColor={color} stopOpacity="0"/>
      </linearGradient></defs>
      {[0,50,100].map(v=>{
        const y=PAD.top+cH-(v/100)*cH;
        return <g key={v}><line x1={PAD.left} x2={PAD.left+cW} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1}/>
          <text x={PAD.left-4} y={y+4} textAnchor="end" fontSize={8} fill="rgba(255,255,255,0.25)">{v}%</text></g>;
      })}
      <polygon points={area} fill="url(#lcGrad)"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round"/>
      {dataPoints.map((d,i)=>(
        <g key={i}>
          <circle cx={PAD.left+i*step} cy={PAD.top+cH-(d.value/max)*cH} r={3} fill={color} stroke="white" strokeWidth={1}/>
          <text x={PAD.left+i*step} y={H-2} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.25)">{d.label}</text>
        </g>
      ))}
    </svg>
  );
}

export default function SmartCityAnalytics() {
  const now = new Date();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  const [tab, setTab] = useState("heatmap");
  const [hour, setHour] = useState(now.getHours());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(v=>v+1), 15000);
    return () => clearInterval(t);
  }, []);

  // Build heatmap data: roads × hours (every 2h)
  const heatHours = [0,2,4,6,8,10,12,14,16,18,20,22];
  const heatData = ROADS.map(r => ({
    road: r.name,
    values: heatHours.map(h => cong(r, h, isWeekend)),
  }));

  // Current snapshot
  const snapshot = ROADS.map(r => ({
    ...r,
    cong: cong(r, hour, isWeekend),
    vehicles: Math.round(cong(r, hour, isWeekend) * 18.5 + 50),
  }));

  const avgCong = Math.round(snapshot.reduce((s,r)=>s+r.cong,0)/snapshot.length);
  const totalVeh = snapshot.reduce((s,r)=>s+r.vehicles,0);

  // Peak hours data
  const peakData = Array.from({length:24}, (_,h) => ({
    label: h%4===0 ? (h===0?"12A":h<12?`${h}A`:h===12?"12P":`${h-12}P`) : "",
    value: Math.round(ROADS.reduce((s,r)=>s+cong(r,h,isWeekend),0)/ROADS.length),
  }));

  // Vehicle distribution
  const vehicleDist = [
    { type:"Cars",       pct:62, color:"#3b82f6", icon:"🚗" },
    { type:"Motorcycles",pct:18, color:"#8b5cf6", icon:"🏍️" },
    { type:"Trucks",     pct:10, color:"#f59e0b", icon:"🚛" },
    { type:"Buses",      pct:6,  color:"#22c55e", icon:"🚌" },
    { type:"Other",      pct:4,  color:"#6b7280", icon:"🚐" },
  ];

  // Carbon analytics (monthly trend)
  const carbonTrend = ["Jan","Feb","Mar","Apr","May","Jun"].map((m,i) => ({
    label:m, value: Math.round(2800 - i * 120 + Math.sin(i) * 80)
  }));

  // Incident stats by type
  const incidentStats = [
    { type:"Accident",    count:23, color:"#ef4444" },
    { type:"Congestion",  count:87, color:"#f97316" },
    { type:"Construction",count:14, color:"#f59e0b" },
    { type:"Flooding",    count:5,  color:"#3b82f6" },
    { type:"Signal Fault",count:31, color:"#a78bfa" },
    { type:"Road Block",  count:9,  color:"#6b7280" },
  ];

  const TABS = [
    { id:"heatmap", label:"🌡️ Heatmap" },
    { id:"peak",    label:"📈 Peak Trends" },
    { id:"hotspot", label:"🚨 Hotspots" },
    { id:"vehicles",label:"🚗 Vehicles" },
    { id:"carbon",  label:"🌿 Carbon" },
    { id:"incidents",label:"📋 Incidents" },
  ];

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
        <div style={{ marginBottom:28, display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#8b5cf6,#06b6d4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🏙️</div>
            <div>
              <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:"white" }}>Smart City Analytics</h1>
              <p style={{ margin:"4px 0 0", color:"rgba(255,255,255,0.45)", fontSize:14 }}>Heatmaps · Peak trends · Accident hotspots · Vehicle distribution · Carbon analytics</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <span style={S.label}>Hour:</span>
            <select value={hour} onChange={e=>setHour(Number(e.target.value))} style={S.select}>
              {Array.from({length:24},(_,h)=><option key={h} value={h}>{h===0?"12 AM":h<12?`${h} AM`:h===12?"12 PM":`${h-12} PM`}{h===now.getHours()?" ★":""}</option>)}
            </select>
          </div>
        </div>

        {/* Network KPIs */}
        <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
          {[
            { icon:"📊", label:"Avg Congestion", value:`${avgCong}%`, color:congColor(avgCong), sub:"network-wide" },
            { icon:"🚗", label:"Total Vehicles",  value:totalVeh.toLocaleString(), color:"#38bdf8", sub:"veh/hr" },
            { icon:"🚨", label:"Active Incidents",value:"6", color:"#f87171", sub:"3 high severity" },
            { icon:"🌿", label:"Daily CO₂",        value:"2.4 t", color:"#4ade80", sub:"city emissions" },
            { icon:"⚡", label:"Avg Speed",        value:`${Math.round((1-avgCong/100*0.88)*110+8)} km/h`, color:"#a78bfa", sub:"network avg" },
            { icon:"🏙️", label:"Roads Monitored", value:ROADS.length, color:"#f59e0b", sub:"smart sensors" },
          ].map(s => (
            <Glass key={s.label} style={{ flex:1, minWidth:120, padding:"16px 20px" }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.65)", marginTop:4 }}>{s.label}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{s.sub}</div>
            </Glass>
          ))}
        </div>

        {/* Tab navigation */}
        <Glass style={{ padding:"6px", marginBottom:24, display:"inline-flex", gap:4, flexWrap:"wrap", borderRadius:12 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:"8px 16px", borderRadius:9, border:"none", fontSize:12, fontWeight:700, cursor:"pointer",
              background:tab===t.id?"rgba(139,92,246,0.25)":"transparent",
              color:tab===t.id?"#c4b5fd":"rgba(255,255,255,0.4)",
            }}>{t.label}</button>
          ))}
        </Glass>

        {/* Tab content */}
        <div style={{ animation:"fadeUp 0.4s ease" }}>
          {/* HEATMAP */}
          {tab==="heatmap" && (
            <Glass style={{ padding:"24px 28px", overflowX:"auto" }}>
              <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:4 }}>🌡️ Congestion Heatmap — {isWeekend?"Weekend":"Weekday"}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:20 }}>Roads × Hours (every 2h) · Color = congestion intensity</div>
              <div style={{ minWidth:560 }}>
                {/* Hour labels */}
                <div style={{ display:"grid", gridTemplateColumns:`120px repeat(${heatHours.length},1fr)`, gap:3, marginBottom:3 }}>
                  <div/>
                  {heatHours.map(h=><div key={h} style={{ textAlign:"center", fontSize:9, color:"rgba(255,255,255,0.3)" }}>{h===0?"12a":h<12?`${h}a`:h===12?"12p":`${h-12}p`}</div>)}
                </div>
                {heatData.map(row => (
                  <div key={row.road} style={{ display:"grid", gridTemplateColumns:`120px repeat(${heatHours.length},1fr)`, gap:3, marginBottom:3 }}>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", display:"flex", alignItems:"center", paddingRight:8 }}>{row.road}</div>
                    {row.values.map((v,i) => <HeatCell key={i} value={v} max={100} label={`${row.road} at ${heatHours[i]}:00`} />)}
                  </div>
                ))}
                <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:12, justifyContent:"flex-end" }}>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>Low</span>
                  {[10,25,40,55,70,85,100].map(v=>{const p=v/100;const r=Math.round(p*239+16);const g=Math.round((1-p)*199+16);return<div key={v} style={{width:20,height:12,borderRadius:2,background:`rgba(${r},${g},16,0.7)`}}/>})}
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>High</span>
                </div>
              </div>
            </Glass>
          )}

          {/* PEAK TRENDS */}
          {tab==="peak" && (
            <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
              <Glass style={{ flex:2, minWidth:300, padding:"24px 28px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:4 }}>📈 24-Hour Congestion Profile</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:20 }}>{isWeekend?"Weekend":"Weekday"} pattern · network average</div>
                <LineChart dataPoints={peakData.filter((_,i)=>i%2===0)} color="#8b5cf6" height={120}/>
              </Glass>
              <Glass style={{ flex:1, minWidth:260, padding:"24px 28px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:16 }}>📅 Weekly Traffic Trends</div>
                <BarChart height={120} data={WEEKLY_DATA.map(d=>({ label:d.day, value:d.avg, color:"linear-gradient(180deg,#3b82f6,#8b5cf6)" }))} />
                <div style={{ marginTop:20 }}>
                  {WEEKLY_DATA.map(d=>(
                    <div key={d.day} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", fontSize:12 }}>
                      <span style={{ color:"rgba(255,255,255,0.5)" }}>{d.day}</span>
                      <span style={{ color:"#38bdf8" }}>{d.vehicles.toLocaleString()} veh</span>
                      <span style={{ color:"#f87171" }}>{d.incidents} inc</span>
                      <span style={{ color:congColor(d.peak) }}>{d.peak}% peak</span>
                    </div>
                  ))}
                </div>
              </Glass>
            </div>
          )}

          {/* HOTSPOTS */}
          {tab==="hotspot" && (
            <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
              <Glass style={{ flex:1, minWidth:280, padding:"24px 28px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:16 }}>🚨 Accident Hotspots</div>
                {HOTSPOTS.map((h,i)=>{
                  const rc = h.risk==="High"?"#ef4444":h.risk==="Medium"?"#f59e0b":"#22c55e";
                  return (
                    <div key={h.road} style={{ padding:"14px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:14, fontWeight:800, color:"rgba(255,255,255,0.2)" }}>#{i+1}</span>
                          <span style={{ fontSize:13, fontWeight:700, color:"white" }}>{h.road}</span>
                        </div>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:`${rc}18`, color:rc }}>{h.risk}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ flex:1, height:8, background:"rgba(255,255,255,0.06)", borderRadius:99 }}>
                          <div style={{ width:`${(h.count/15)*100}%`, height:"100%", background:rc, borderRadius:99 }}/>
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, color:rc }}>{h.count} incidents/mo</span>
                      </div>
                    </div>
                  );
                })}
              </Glass>
              <Glass style={{ flex:2, minWidth:300, padding:"24px 28px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:16 }}>📊 Road Safety Comparison</div>
                <BarChart height={140} data={HOTSPOTS.map(h=>({
                  label:h.road.split(" ")[0], value:h.count,
                  color:h.risk==="High"?"linear-gradient(180deg,#ef4444,#dc2626)":h.risk==="Medium"?"linear-gradient(180deg,#f59e0b,#d97706)":"linear-gradient(180deg,#22c55e,#16a34a)",
                }))}/>
              </Glass>
            </div>
          )}

          {/* VEHICLES */}
          {tab==="vehicles" && (
            <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
              <Glass style={{ flex:1, minWidth:260, padding:"24px 28px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:20 }}>🚗 Vehicle Distribution</div>
                {vehicleDist.map(v=>(
                  <div key={v.type} style={{ marginBottom:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:13, color:"rgba(255,255,255,0.65)" }}>{v.icon} {v.type}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:v.color }}>{v.pct}%</span>
                    </div>
                    <div style={{ height:8, background:"rgba(255,255,255,0.06)", borderRadius:99 }}>
                      <div style={{ width:`${v.pct}%`, height:"100%", background:v.color, borderRadius:99, transition:"width 0.8s" }}/>
                    </div>
                  </div>
                ))}
              </Glass>
              <Glass style={{ flex:2, minWidth:300, padding:"24px 28px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:16 }}>🚦 Current Road Congestion Snapshot</div>
                {snapshot.sort((a,b)=>b.cong-a.cong).map((r,i)=>(
                  <div key={r.name} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.2)", minWidth:20 }}>{i+1}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:"white", marginBottom:4 }}>{r.name}</div>
                      <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:99 }}>
                        <div style={{ width:`${r.cong}%`, height:"100%", background:congColor(r.cong), borderRadius:99 }}/>
                      </div>
                    </div>
                    <span style={{ fontSize:12, fontWeight:800, color:congColor(r.cong), minWidth:36 }}>{r.cong}%</span>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)", minWidth:70 }}>{r.vehicles.toLocaleString()} veh</span>
                  </div>
                ))}
              </Glass>
            </div>
          )}

          {/* CARBON */}
          {tab==="carbon" && (
            <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
              <Glass style={{ flex:1, minWidth:260, padding:"24px 28px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:4 }}>🌿 Monthly CO₂ Trend</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:16 }}>City-wide vehicle emissions (tonnes)</div>
                <LineChart dataPoints={carbonTrend} color="#22c55e" height={100}/>
                <div style={{ marginTop:16, padding:"12px 16px", background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.15)", borderRadius:10 }}>
                  <div style={{ fontSize:13, color:"#4ade80", fontWeight:700 }}>📉 14.3% reduction YTD</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginTop:4 }}>Smart routing saved ~420 tonnes this year</div>
                </div>
              </Glass>
              <Glass style={{ flex:2, minWidth:300, padding:"24px 28px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:16 }}>🌍 Carbon by Road Zone</div>
                {[
                  { zone:"Commercial",  co2:820, pct:32, color:"#ef4444" },
                  { zone:"Urban Core",  co2:640, pct:25, color:"#f97316" },
                  { zone:"Arterial",    co2:430, pct:17, color:"#f59e0b" },
                  { zone:"Expressway",  co2:380, pct:15, color:"#3b82f6" },
                  { zone:"Peripheral",  co2:180, pct:7,  color:"#22c55e" },
                  { zone:"Other",       co2:105, pct:4,  color:"#6b7280" },
                ].map(z=>(
                  <div key={z.zone} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:13, color:"rgba(255,255,255,0.65)" }}>{z.zone}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:z.color }}>{z.co2} t/mo · {z.pct}%</span>
                    </div>
                    <div style={{ height:8, background:"rgba(255,255,255,0.06)", borderRadius:99 }}>
                      <div style={{ width:`${z.pct}%`, height:"100%", background:z.color, borderRadius:99, transition:"width 0.8s" }}/>
                    </div>
                  </div>
                ))}
              </Glass>
            </div>
          )}

          {/* INCIDENTS */}
          {tab==="incidents" && (
            <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
              <Glass style={{ flex:1, minWidth:260, padding:"24px 28px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:20 }}>📋 Incident Statistics (30 days)</div>
                {incidentStats.map(s=>(
                  <div key={s.type} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontSize:13, color:"rgba(255,255,255,0.65)" }}>{s.type}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:s.color }}>{s.count}</span>
                    </div>
                    <div style={{ height:7, background:"rgba(255,255,255,0.06)", borderRadius:99 }}>
                      <div style={{ width:`${(s.count/87)*100}%`, height:"100%", background:s.color, borderRadius:99 }}/>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop:16, padding:"12px", background:"rgba(255,255,255,0.03)", borderRadius:10, fontSize:12, color:"rgba(255,255,255,0.45)", lineHeight:1.7 }}>
                  Total incidents: <strong style={{color:"white"}}>169</strong><br/>
                  Avg resolution: <strong style={{color:"#4ade80"}}>23 min</strong><br/>
                  Community reports: <strong style={{color:"#38bdf8"}}>47 verified</strong>
                </div>
              </Glass>
              <Glass style={{ flex:2, minWidth:300, padding:"24px 28px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:16 }}>📊 Incident Distribution Chart</div>
                <BarChart height={160} data={incidentStats.map(s=>({ label:s.type.split(" ")[0], value:s.count, color:`linear-gradient(180deg,${s.color},${s.color}88)` }))}/>
                <div style={{ marginTop:20, display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                  {[
                    { label:"Peak Day",    value:"Wednesday", color:"#f97316" },
                    { label:"Peak Hour",   value:"8-9 AM",    color:"#ef4444" },
                    { label:"Safest Road", value:"Riverside",  color:"#22c55e" },
                  ].map(s=>(
                    <div key={s.label} style={{ padding:"12px", background:"rgba(255,255,255,0.03)", borderRadius:10, textAlign:"center" }}>
                      <div style={{ fontSize:14, fontWeight:800, color:s.color }}>{s.value}</div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:4 }}>{s.label}</div>
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
