import React, { useState, useEffect, useRef } from "react";

function Glass({ children, style = {} }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.10)", borderRadius:16, backdropFilter:"blur(20px)", ...style }}>
      {children}
    </div>
  );
}

const VEHICLE_TYPES = [
  { id:"ambulance", label:"Ambulance",     emoji:"🚑", color:"#ef4444", desc:"Medical emergency response" },
  { id:"police",    label:"Police",        emoji:"🚔", color:"#3b82f6", desc:"Law enforcement response"   },
  { id:"fire",      label:"Fire Services", emoji:"🚒", color:"#f97316", desc:"Fire & rescue response"     },
];

const ROUTES_DB = [
  {
    name:"Central Emergency Corridor",
    via:"Central Avenue → Hospital Link",
    distKm:5.2, baseMin:7, clearance:0.95,
    lanes:4, signals:3, hospitals:["City General Hospital"],
    tag:"Fastest", tagColor:"#22c55e",
  },
  {
    name:"North Ring Emergency Route",
    via:"North Ring Road → Medical District",
    distKm:7.8, baseMin:10, clearance:0.85,
    lanes:3, signals:5, hospitals:["St. Mary's Hospital"],
    tag:"Alternate", tagColor:"#f59e0b",
  },
  {
    name:"Airport-Link Emergency Express",
    via:"Airport Link Highway → Bypass",
    distKm:11.2, baseMin:14, clearance:0.75,
    lanes:6, signals:2, hospitals:["Northern Medical Center"],
    tag:"Expressway", tagColor:"#3b82f6",
  },
];

const HOSPITALS = [
  { name:"City General Hospital",       dist:5.2,  beds:320, er:"Open", traumaLevel:1 },
  { name:"St. Mary's Medical Center",   dist:7.8,  beds:280, er:"Open", traumaLevel:2 },
  { name:"Northern Medical Center",     dist:11.2, beds:450, er:"Open", traumaLevel:1 },
  { name:"South District Clinic",       dist:14.5, beds:120, er:"Open", traumaLevel:3 },
];

const STEP_ICONS = { depart:"🚦", straight:"↑", left:"↰", right:"↱", arrive:"🏁" };

function generateSteps(route, vehicleType) {
  return [
    { type:"depart",   inst:`Dispatch ${vehicleType.emoji} from base station`,   dist:"0 m",    time:"0 min" },
    { type:"straight", inst:`Proceed on ${route.via.split("→")[0].trim()}`,       dist:"1.2 km", time:"1 min" },
    { type:"right",    inst:"Signal override — take right at junction",            dist:"2.0 km", time:"3 min" },
    { type:"straight", inst:"Clear corridor active — maintain priority",           dist:"3.5 km", time:"5 min" },
    { type:"left",     inst:`Turn onto ${route.via.split("→")[1]?.trim() || "Emergency Road"}`, dist:"4.8 km", time:"7 min" },
    { type:"arrive",   inst:`Arrive at ${HOSPITALS[0].name}`,                     dist:`${route.distKm} km`, time:`${route.baseMin} min` },
  ];
}

let dispatchId = 1;

export default function EmergencyVehicle() {
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES[0]);
  const [origin, setOrigin] = useState("Downtown Main Street");
  const [incident, setIncident] = useState("City General Hospital");
  const [selectedRoute, setSelectedRoute] = useState(ROUTES_DB[0]);
  const [dispatched, setDispatched] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [dispatchLog, setDispatchLog] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const timerRef = useRef(null);

  const steps = generateSteps(selectedRoute, vehicleType);
  const eta = selectedRoute.baseMin;
  const progress = dispatched ? Math.min((elapsedSec / (eta * 60)) * 100, 100) : 0;

  function dispatch() {
    if (dispatched) return;
    setDispatched(true);
    setElapsedSec(0);
    setStepIdx(0);
    const entry = {
      id: dispatchId++,
      vehicle: vehicleType.label,
      emoji: vehicleType.emoji,
      route: selectedRoute.name,
      eta: eta,
      time: new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
    };
    setDispatchLog(prev => [entry, ...prev].slice(0, 5));
  }

  function stopDispatch() {
    setDispatched(false);
    setElapsedSec(0);
    setStepIdx(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  useEffect(() => {
    if (!dispatched) return;
    timerRef.current = setInterval(() => {
      setElapsedSec(prev => {
        const next = prev + 1;
        const stepProgress = (next / (eta * 60)) * steps.length;
        setStepIdx(Math.min(Math.floor(stepProgress), steps.length - 1));
        if (next >= eta * 60) { clearInterval(timerRef.current); setDispatched(false); }
        return next;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [dispatched]);

  const elapsedMin = Math.floor(elapsedSec / 60);
  const elapsedS = elapsedSec % 60;
  const remainingMin = Math.max(0, eta - elapsedMin - (elapsedS > 0 ? 1 : 0));

  const S = {
    page: { backgroundColor:"#0a0f1e", minHeight:"100vh", padding:"28px 32px", fontFamily:"system-ui,sans-serif" },
    label: { fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:6 },
    select: { width:"100%", padding:"10px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, fontSize:13, color:"white", outline:"none", cursor:"pointer" },
  };

  return (
    <>
      
      <style>{`
        select option{background:#1a1f2e;color:white}
        @keyframes pulse-ring{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)}50%{box-shadow:0 0 0 12px rgba(239,68,68,0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes siren{0%,100%{background:linear-gradient(135deg,#ef4444,#dc2626)}50%{background:linear-gradient(135deg,#3b82f6,#2563eb)}}
      `}</style>
      <div style={S.page}>
        {/* Header */}
        <div style={{ marginBottom:28, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#ef4444,#f97316)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, animation: dispatched ? "siren 1s infinite" : "none" }}>🚨</div>
          <div>
            <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:"white" }}>Emergency Vehicle Mode</h1>
            <p style={{ margin:"4px 0 0", color:"rgba(255,255,255,0.45)", fontSize:14 }}>Priority routing for Ambulance · Police · Fire Services with real-time navigation</p>
          </div>
          {dispatched && (
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, padding:"8px 16px", background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#ef4444", animation:"pulse-ring 1.4s infinite" }} />
              <span style={{ fontSize:13, fontWeight:700, color:"#f87171" }}>LIVE DISPATCH</span>
            </div>
          )}
        </div>

        {/* Vehicle type selector */}
        <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
          {VEHICLE_TYPES.map(v => (
            <button key={v.id} onClick={()=>!dispatched&&setVehicleType(v)} style={{
              flex:1, minWidth:160, padding:"16px 20px", border:`1px solid ${vehicleType.id===v.id?v.color+"60":"rgba(255,255,255,0.1)"}`,
              background: vehicleType.id===v.id ? `${v.color}15` : "rgba(255,255,255,0.03)",
              borderRadius:14, cursor: dispatched?"not-allowed":"pointer", textAlign:"left", transition:"all 0.2s",
            }}>
              <div style={{ fontSize:28, marginBottom:6 }}>{v.emoji}</div>
              <div style={{ fontSize:14, fontWeight:800, color: vehicleType.id===v.id ? v.color : "white" }}>{v.label}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:2 }}>{v.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
          {/* Left: Controls + route selection */}
          <div style={{ flex:1, minWidth:300, display:"flex", flexDirection:"column", gap:20 }}>
            <Glass style={{ padding:"24px 28px" }}>
              <div style={{ fontSize:14, fontWeight:700, color:"white", marginBottom:18 }}>📍 Dispatch Configuration</div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <label style={S.label}>Origin / Base Station</label>
                  <select value={origin} onChange={e=>setOrigin(e.target.value)} disabled={dispatched} style={S.select}>
                    {["Downtown Main Street","Central Avenue","East Highway I-42","North Ring Road","West Bridge Corridor"].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Incident Location / Destination</label>
                  <select value={incident} onChange={e=>setIncident(e.target.value)} disabled={dispatched} style={S.select}>
                    {HOSPITALS.map(h=><option key={h.name} value={h.name}>{h.name} ({h.dist} km)</option>)}
                  </select>
                </div>
              </div>
            </Glass>

            {/* Route options */}
            <Glass style={{ padding:"24px 28px" }}>
              <div style={{ fontSize:14, fontWeight:700, color:"white", marginBottom:16 }}>🛣️ Emergency Route Options</div>
              {ROUTES_DB.map(r => (
                <div key={r.name} onClick={()=>!dispatched&&setSelectedRoute(r)}
                  style={{ padding:"14px 16px", borderRadius:12, marginBottom:10, cursor:dispatched?"not-allowed":"pointer",
                    border:`1px solid ${selectedRoute.name===r.name?vehicleType.color+"50":"rgba(255,255,255,0.06)"}`,
                    background:selectedRoute.name===r.name?`${vehicleType.color}10`:"rgba(255,255,255,0.02)", transition:"all 0.2s" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"white" }}>{r.name}</span>
                    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:`${r.tagColor}15`, color:r.tagColor }}>{r.tag}</span>
                  </div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginBottom:8 }}>via {r.via}</div>
                  <div style={{ display:"flex", gap:14 }}>
                    <span style={{ fontSize:12, color:"#38bdf8" }}>📏 {r.distKm} km</span>
                    <span style={{ fontSize:12, color:"#22c55e" }}>⚡ {r.baseMin} min ETA</span>
                    <span style={{ fontSize:12, color:"#a78bfa" }}>🚦 {r.signals} signals</span>
                  </div>
                </div>
              ))}
            </Glass>

            {/* Dispatch log */}
            {dispatchLog.length > 0 && (
              <Glass style={{ padding:"20px 24px" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"white", marginBottom:12 }}>📋 Recent Dispatches</div>
                {dispatchLog.map(d => (
                  <div key={d.id} style={{ padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", fontSize:12, display:"flex", justifyContent:"space-between" }}>
                    <span style={{ color:"rgba(255,255,255,0.55)" }}>{d.emoji} {d.vehicle} — {d.route.split(" ")[0]}</span>
                    <span style={{ color:"rgba(255,255,255,0.3)" }}>{d.time}</span>
                  </div>
                ))}
              </Glass>
            )}
          </div>

          {/* Right: Navigation panel */}
          <div style={{ flex:2, minWidth:340, display:"flex", flexDirection:"column", gap:20 }}>
            {/* Dispatch status */}
            <Glass style={{ padding:"28px", border:`1px solid ${vehicleType.color}30`, background:`${vehicleType.color}08` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                <div>
                  <div style={{ fontSize:32, marginBottom:4 }}>{vehicleType.emoji}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"white" }}>{vehicleType.label} Dispatch</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:4 }}>{selectedRoute.name}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:42, fontWeight:900, color: vehicleType.color, lineHeight:1 }}>
                    {dispatched ? remainingMin : eta}
                  </div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>min ETA</div>
                </div>
              </div>

              {/* Progress */}
              <div style={{ marginBottom:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(255,255,255,0.35)", marginBottom:8 }}>
                  <span>{dispatched ? `${String(elapsedMin).padStart(2,"0")}:${String(elapsedS).padStart(2,"0")} elapsed` : "Ready to dispatch"}</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
                <div style={{ height:10, background:"rgba(255,255,255,0.06)", borderRadius:99, overflow:"hidden" }}>
                  <div style={{ width:`${progress}%`, height:"100%", background:`linear-gradient(90deg,${vehicleType.color},${vehicleType.color}bb)`, borderRadius:99, transition:"width 1s linear", boxShadow:`0 0 10px ${vehicleType.color}60` }} />
                </div>
              </div>

              <div style={{ display:"flex", gap:12 }}>
                {!dispatched ? (
                  <button onClick={dispatch} style={{ flex:1, padding:"14px", background:`linear-gradient(135deg,${vehicleType.color},${vehicleType.color}bb)`, color:"white", border:"none", borderRadius:12, fontSize:15, fontWeight:800, cursor:"pointer", boxShadow:`0 4px 20px ${vehicleType.color}40` }}>
                    🚨 DISPATCH {vehicleType.label.toUpperCase()}
                  </button>
                ) : (
                  <button onClick={stopDispatch} style={{ flex:1, padding:"14px", background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.7)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, fontSize:15, fontWeight:700, cursor:"pointer" }}>
                    ■ Cancel Dispatch
                  </button>
                )}
              </div>
            </Glass>

            {/* Turn-by-turn */}
            <Glass style={{ overflow:"hidden" }}>
              <div style={{ padding:"18px 22px", borderBottom:"1px solid rgba(255,255,255,0.07)", fontSize:14, fontWeight:700, color:"white" }}>
                🗺️ Turn-by-Turn Navigation
              </div>
              <div style={{ padding:"8px 0" }}>
                {steps.map((step, i) => {
                  const isCurrent = dispatched && i === stepIdx;
                  const isDone = dispatched && i < stepIdx;
                  return (
                    <div key={i} style={{ padding:"14px 22px", borderBottom:"1px solid rgba(255,255,255,0.04)",
                      background: isCurrent ? `${vehicleType.color}12` : "transparent", transition:"background 0.3s" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <div style={{ width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16,
                          background: isCurrent ? vehicleType.color : isDone ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)",
                          border:`1px solid ${isCurrent?vehicleType.color:isDone?"rgba(34,197,94,0.3)":"rgba(255,255,255,0.1)"}`,
                          flexShrink:0 }}>
                          {isDone ? "✓" : STEP_ICONS[step.type]}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? "white" : "rgba(255,255,255,0.55)" }}>{step.inst}</div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:2 }}>{step.dist} · {step.time}</div>
                        </div>
                        {isCurrent && <span style={{ fontSize:11, color:vehicleType.color, fontWeight:700 }}>● NOW</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Glass>

            {/* Nearby hospitals */}
            <Glass style={{ padding:"24px 28px" }}>
              <div style={{ fontSize:14, fontWeight:700, color:"white", marginBottom:16 }}>🏥 Nearest Hospitals</div>
              {HOSPITALS.map((h, i) => (
                <div key={h.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:"white" }}>{h.name}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>Level {h.traumaLevel} Trauma · {h.beds} beds</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#38bdf8" }}>{h.dist} km</div>
                    <div style={{ fontSize:10, color:"#22c55e" }}>ER {h.er}</div>
                  </div>
                </div>
              ))}
            </Glass>
          </div>
        </div>
      </div>
    </>
  );
}
