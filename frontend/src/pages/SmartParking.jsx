import React, { useState, useEffect } from "react";

function Glass({ children, style = {} }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.10)", borderRadius:16, backdropFilter:"blur(20px)", ...style }}>
      {children}
    </div>
  );
}

const PARKING_LOTS = [
  { id:1, name:"Central Plaza Parking",    area:"Downtown",      total:450, lat:12.98, lon:77.60, type:"Multi-storey", rate:2.5, ev:true,  covered:true  },
  { id:2, name:"Market District Lot A",    area:"Market District",total:280, lat:12.97, lon:77.59, type:"Surface",      rate:1.5, ev:false, covered:false },
  { id:3, name:"Tech Hub Parking Tower",   area:"Tech Park",     total:600, lat:12.96, lon:77.62, type:"Multi-storey", rate:3.0, ev:true,  covered:true  },
  { id:4, name:"Airport Public Parking",   area:"Airport",       total:1200,lat:13.00, lon:77.61, type:"Multi-storey", rate:4.0, ev:true,  covered:true  },
  { id:5, name:"University Avenue Lot",    area:"University",    total:200, lat:12.96, lon:77.55, type:"Surface",      rate:1.0, ev:false, covered:false },
  { id:6, name:"Commerce Boulevard Park",  area:"Commerce",      total:350, lat:12.97, lon:77.63, type:"Multi-storey", rate:2.0, ev:true,  covered:true  },
  { id:7, name:"Riverside Parking",        area:"Riverside",     total:150, lat:12.95, lon:77.64, type:"Surface",      rate:1.0, ev:false, covered:false },
  { id:8, name:"Industrial Zone Depot",    area:"Industrial",    total:500, lat:12.93, lon:77.60, type:"Surface",      rate:0.5, ev:false, covered:false },
];

const HOUR_PROFILE = [
  0.08,0.05,0.04,0.04,0.06,0.12,0.28,0.68,0.88,0.82,0.74,0.78,
  0.90,0.86,0.80,0.82,0.92,0.95,0.78,0.60,0.45,0.32,0.20,0.12,
];

function getOccupancy(lot, hour) {
  const base = HOUR_PROFILE[hour % 24];
  const hash = lot.id * 7 + lot.name.charCodeAt(0);
  const noise = (Math.sin(hash * 0.3 + hour * 0.5) * 0.08);
  const occ = Math.min(0.99, Math.max(0.02, base + noise));
  return Math.round(occ * 100);
}

function futureOccupancy(lot, currentHour, offsetHours) {
  const h = (currentHour + offsetHours) % 24;
  return getOccupancy(lot, h);
}

function availColor(pct) {
  const avail = 100 - pct;
  if (avail <= 5)  return { color:"#ef4444", label:"Full",     bg:"rgba(239,68,68,0.12)"  };
  if (avail <= 20) return { color:"#f97316", label:"Almost Full", bg:"rgba(249,115,22,0.12)" };
  if (avail <= 50) return { color:"#f59e0b", label:"Filling",   bg:"rgba(245,158,11,0.12)" };
  return              { color:"#22c55e", label:"Available", bg:"rgba(34,197,94,0.12)"  };
}

function MiniChart({ lot, currentHour }) {
  const W=120, H=36, n=8;
  const points = Array.from({length:n},(_,i) => futureOccupancy(lot, currentHour, i));
  const step = W/(n-1);
  const pts = points.map((v,i)=>`${i*step},${H-(v/100)*H}`).join(" ");
  const area = `0,${H} ${pts} ${(n-1)*step},${H}`;
  return (
    <svg width={W} height={H} style={{display:"block"}}>
      <defs><linearGradient id={`g${lot.id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
      </linearGradient></defs>
      <polygon points={area} fill={`url(#g${lot.id})`}/>
      <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth={1.8} strokeLinejoin="round"/>
    </svg>
  );
}

export default function SmartParking() {
  const now = new Date();
  const [hour, setHour] = useState(now.getHours());
  const [selected, setSelected] = useState(PARKING_LOTS[0]);
  const [filter, setFilter] = useState("All");
  const [evOnly, setEvOnly] = useState(false);
  const [coveredOnly, setCoveredOnly] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(v => v+1), 30000);
    return () => clearInterval(t);
  }, []);

  const lots = PARKING_LOTS.map(l => {
    const occ = getOccupancy(l, hour);
    const available = Math.round(l.total * (1 - occ/100));
    return { ...l, occ, available, cl: availColor(occ) };
  });

  const filtered = lots.filter(l => {
    if (evOnly && !l.ev) return false;
    if (coveredOnly && !l.covered) return false;
    if (filter === "Available" && l.occ >= 95) return false;
    if (filter === "EV" && !l.ev) return false;
    return true;
  });

  const sel = lots.find(l => l.id === selected.id);

  const S = {
    page: { backgroundColor:"#0a0f1e", minHeight:"100vh", padding:"28px 32px", fontFamily:"system-ui,sans-serif" },
    label: { fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:"0.08em" },
    select: { padding:"9px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, fontSize:13, color:"white", outline:"none", cursor:"pointer" },
  };

  const totalAvail = lots.reduce((s,l) => s + l.available, 0);
  const totalSpots = lots.reduce((s,l) => s + l.total, 0);

  return (
    <>
      
      <style>{`select option{background:#1a1f2e;color:white} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={S.page}>
        {/* Header */}
        <div style={{ marginBottom:28, display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🅿️</div>
            <div>
              <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:"white" }}>Smart Parking</h1>
              <p style={{ margin:"4px 0 0", color:"rgba(255,255,255,0.45)", fontSize:14 }}>Real-time availability · AI future predictions · EV charging spots</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <span style={S.label}>Hour:</span>
            <select value={hour} onChange={e=>setHour(Number(e.target.value))} style={S.select}>
              {Array.from({length:24},(_,h) => <option key={h} value={h}>{h===0?"12 AM":h<12?`${h} AM`:h===12?"12 PM":`${h-12} PM`}{h===now.getHours()?" (now)":""}</option>)}
            </select>
          </div>
        </div>

        {/* Network stats */}
        <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
          {[
            { icon:"🅿️", label:"Total Spots",     value:totalSpots.toLocaleString(), color:"#38bdf8", sub:"across network" },
            { icon:"✅", label:"Available Now",    value:totalAvail.toLocaleString(), color:"#22c55e", sub:`${Math.round(totalAvail/totalSpots*100)}% free` },
            { icon:"🔴", label:"Occupied",         value:(totalSpots-totalAvail).toLocaleString(), color:"#f87171", sub:"taken" },
            { icon:"⚡", label:"EV Charging Lots", value:lots.filter(l=>l.ev).length, color:"#a78bfa", sub:"EV-ready" },
            { icon:"🏢", label:"Covered Parking",  value:lots.filter(l=>l.covered).length, color:"#f59e0b", sub:"weatherproof" },
            { icon:"💰", label:"Avg Rate",         value:`$${(lots.reduce((s,l)=>s+l.rate,0)/lots.length).toFixed(1)}/hr`, color:"#4ade80", sub:"per hour" },
          ].map(s => (
            <Glass key={s.label} style={{ flex:1, minWidth:120, padding:"16px 20px" }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.7)", marginTop:4 }}>{s.label}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{s.sub}</div>
            </Glass>
          ))}
        </div>

        {/* Filters */}
        <Glass style={{ padding:"14px 20px", marginBottom:20, display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          {["All","Available","EV"].map(f => (
            <button key={f} onClick={()=>setFilter(f)} style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${filter===f?"rgba(59,130,246,0.5)":"rgba(255,255,255,0.1)"}`, background:filter===f?"rgba(59,130,246,0.15)":"transparent", color:filter===f?"#60a5fa":"rgba(255,255,255,0.45)", fontSize:12, fontWeight:700, cursor:"pointer" }}>
              {f}
            </button>
          ))}
          <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12, color:"rgba(255,255,255,0.55)" }}>
            <input type="checkbox" checked={evOnly} onChange={e=>setEvOnly(e.target.checked)} />⚡ EV Only
          </label>
          <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12, color:"rgba(255,255,255,0.55)" }}>
            <input type="checkbox" checked={coveredOnly} onChange={e=>setCoveredOnly(e.target.checked)} />🏢 Covered Only
          </label>
        </Glass>

        <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
          {/* Parking list */}
          <div style={{ flex:1, minWidth:300 }}>
            <Glass style={{ overflow:"hidden" }}>
              <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)", fontSize:13, fontWeight:700, color:"white" }}>
                🗂️ Parking Locations ({filtered.length})
              </div>
              <div style={{ maxHeight:580, overflowY:"auto" }}>
                {filtered.map(l => (
                  <div key={l.id} onClick={()=>setSelected(PARKING_LOTS.find(p=>p.id===l.id))}
                    style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.04)", cursor:"pointer",
                      background:l.id===selected.id?"rgba(59,130,246,0.08)":"transparent", transition:"background 0.2s" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"white" }}>{l.name}</div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:2 }}>📍 {l.area} · {l.type}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:16, fontWeight:800, color:l.cl.color }}>{l.available}</div>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>of {l.total} free</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                      <div style={{ flex:1, height:6, background:"rgba(255,255,255,0.06)", borderRadius:99 }}>
                        <div style={{ width:`${l.occ}%`, height:"100%", background:l.cl.color, borderRadius:99, transition:"width 0.6s ease" }} />
                      </div>
                      <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:99, background:l.cl.bg, color:l.cl.color }}>{l.cl.label}</span>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>💰 ${l.rate}/hr</span>
                      {l.ev && <span style={{ fontSize:10, color:"#a78bfa" }}>⚡ EV</span>}
                      {l.covered && <span style={{ fontSize:10, color:"#38bdf8" }}>🏢 Covered</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Glass>
          </div>

          {/* Detail + prediction */}
          {sel && (
            <div style={{ flex:2, minWidth:340, display:"flex", flexDirection:"column", gap:20, animation:"fadeUp 0.4s ease" }}>
              {/* Current status */}
              <Glass style={{ padding:"24px 28px", border:`1px solid ${sel.cl.color}25` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                  <div>
                    <div style={{ fontSize:18, fontWeight:800, color:"white", marginBottom:4 }}>{sel.name}</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>📍 {sel.area} · {sel.type} · ${sel.rate}/hr</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    {(() => {
                      const r=40,cx=50,cy=50,sw=8;
                      const circ=2*Math.PI*r;
                      const dash=(sel.occ/100)*circ;
                      return (
                        <svg width={100} height={100}>
                          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw}/>
                          <circle cx={cx} cy={cy} r={r} fill="none" stroke={sel.cl.color} strokeWidth={sw}
                            strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}/>
                          <text x={cx} y={cy-4} textAnchor="middle" fontSize={18} fontWeight={800} fill="white">{sel.occ}%</text>
                          <text x={cx} y={cy+12} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.35)">occupied</text>
                        </svg>
                      );
                    })()}
                    <div style={{ fontSize:11, fontWeight:700, color:sel.cl.color }}>{sel.cl.label}</div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                  {[
                    { icon:"✅", label:"Available", value:sel.available, color:"#22c55e" },
                    { icon:"🔴", label:"Occupied",  value:sel.total - sel.available, color:"#f87171" },
                    { icon:"🏢", label:"Total",     value:sel.total, color:"#38bdf8" },
                    { icon:"💰", label:"Rate",      value:`$${sel.rate}/hr`, color:"#f59e0b" },
                  ].map(s => (
                    <div key={s.label} style={{ flex:1, minWidth:80, padding:"12px", background:"rgba(255,255,255,0.03)", border:`1px solid ${s.color}18`, borderRadius:10, textAlign:"center" }}>
                      <div style={{ fontSize:18 }}>{s.icon}</div>
                      <div style={{ fontSize:18, fontWeight:800, color:s.color, marginTop:4 }}>{s.value}</div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {sel.ev && (
                  <div style={{ marginTop:14, padding:"10px 14px", background:"rgba(139,92,246,0.1)", border:"1px solid rgba(139,92,246,0.2)", borderRadius:10, fontSize:12, color:"#c4b5fd" }}>
                    ⚡ EV Charging Available — Type 2 AC & DC Fast Charging
                  </div>
                )}
              </Glass>

              {/* Future predictions */}
              <Glass style={{ padding:"24px 28px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:4 }}>🔮 Predicted Availability</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:16 }}>Next 8 hours · AI-estimated</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {Array.from({length:8},(_,i) => {
                    const h = (hour + i) % 24;
                    const occ = futureOccupancy(sel, hour, i);
                    const avail = Math.round(sel.total * (1 - occ/100));
                    const cl = availColor(occ);
                    return (
                      <div key={i} style={{ flex:1, minWidth:70, padding:"12px 10px", background:"rgba(255,255,255,0.03)", border:`1px solid ${cl.color}20`, borderRadius:10, textAlign:"center" }}>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:6 }}>{i===0?"Now":`+${i}h`}</div>
                        <div style={{ fontSize:15, fontWeight:800, color:cl.color }}>{occ}%</div>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{avail} free</div>
                        <div style={{ marginTop:6, height:4, background:"rgba(255,255,255,0.06)", borderRadius:99 }}>
                          <div style={{ width:`${occ}%`, height:"100%", background:cl.color, borderRadius:99 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop:16 }}>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:8 }}>Trend (next 8 hours)</div>
                  <MiniChart lot={sel} currentHour={hour} />
                </div>
              </Glass>

              {/* All lots grid */}
              <Glass style={{ padding:"24px 28px" }}>
                <div style={{ fontSize:14, fontWeight:700, color:"white", marginBottom:16 }}>📊 Network Availability Snapshot</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
                  {lots.map(l => (
                    <div key={l.id} onClick={()=>setSelected(PARKING_LOTS.find(p=>p.id===l.id))}
                      style={{ padding:"12px", borderRadius:10, background:`${l.cl.color}0a`, border:`1px solid ${l.cl.color}25`, cursor:"pointer" }}>
                      <div style={{ fontSize:11, fontWeight:700, color:l.cl.color, marginBottom:4 }}>{l.available} free</div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>{l.name.split(" ").slice(0,2).join(" ")}</div>
                      <div style={{ marginTop:6, height:4, background:"rgba(255,255,255,0.06)", borderRadius:99 }}>
                        <div style={{ width:`${l.occ}%`, height:"100%", background:l.cl.color, borderRadius:99 }} />
                      </div>
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
