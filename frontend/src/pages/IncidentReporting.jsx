import React, { useState, useEffect } from "react";

function Glass({ children, style = {} }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.10)", borderRadius:16, backdropFilter:"blur(20px)", ...style }}>
      {children}
    </div>
  );
}

const INCIDENT_TYPES = [
  { id:"accident",   label:"Accident",           emoji:"🚨", color:"#ef4444", severity:"High"   },
  { id:"flood",      label:"Flood",              emoji:"🌊", color:"#3b82f6", severity:"High"   },
  { id:"roadblock",  label:"Road Block",         emoji:"🚧", color:"#f59e0b", severity:"High"   },
  { id:"pothole",    label:"Pothole",            emoji:"🕳️", color:"#a78bfa", severity:"Medium" },
  { id:"construction",label:"Construction",      emoji:"🏗️", color:"#f97316", severity:"Medium" },
  { id:"signal",     label:"Signal Failure",     emoji:"🚦", color:"#ef4444", severity:"Medium" },
  { id:"breakdown",  label:"Vehicle Breakdown",  emoji:"🔧", color:"#6b7280", severity:"Low"    },
  { id:"debris",     label:"Debris on Road",     emoji:"⚠️", color:"#d97706", severity:"Medium" },
];

const ROADS = [
  "Market District Road","Downtown Main Street","Central Avenue","East Highway I-42",
  "North Ring Road","Airport Link Highway","West Bridge Corridor","South Bypass Expressway",
  "Commerce Boulevard","University Avenue","Industrial Park Road","Riverside Drive",
];

const SEED_REPORTS = [
  { id:1, type:"Accident",    emoji:"🚨", road:"Market District Road", desc:"Multi-vehicle collision near junction",  status:"Verified",  severity:"High",   time:"08:14 AM", reporter:"Anonymous", votes:12 },
  { id:2, type:"Flood",       emoji:"🌊", road:"West Bridge Corridor", desc:"Surface water crossing, 30cm deep",     status:"Verified",  severity:"High",   time:"09:02 AM", reporter:"User_4421", votes:8  },
  { id:3, type:"Pothole",     emoji:"🕳️", road:"Commerce Boulevard",   desc:"Large pothole near bus stop",           status:"Pending",   severity:"Medium", time:"10:30 AM", reporter:"Anonymous", votes:5  },
  { id:4, type:"Signal Failure",emoji:"🚦",road:"Central Avenue",      desc:"Traffic light stuck on red",            status:"Verified",  severity:"Medium", time:"11:15 AM", reporter:"User_9002", votes:19 },
  { id:5, type:"Construction",emoji:"🏗️", road:"East Highway I-42",   desc:"Lane closure due to bridge work",        status:"Pending",   severity:"Medium", time:"07:45 AM", reporter:"Admin",     votes:3  },
  { id:6, type:"Road Block",  emoji:"🚧", road:"Downtown Main Street", desc:"Police barricade for event",            status:"Rejected",  severity:"High",   time:"06:30 AM", reporter:"Anonymous", votes:1  },
];

function statusColor(s) {
  if (s==="Verified")  return { color:"#22c55e", bg:"rgba(34,197,94,0.12)"  };
  if (s==="Pending")   return { color:"#f59e0b", bg:"rgba(245,158,11,0.12)" };
  if (s==="Rejected")  return { color:"#6b7280", bg:"rgba(107,114,128,0.12)"};
  return { color:"#6b7280", bg:"rgba(107,114,128,0.12)" };
}

function sevColor(s) {
  if (s==="High")   return "#ef4444";
  if (s==="Medium") return "#f59e0b";
  return "#22c55e";
}

let nextId = SEED_REPORTS.length + 1;

export default function IncidentReporting() {
  const [reports, setReports] = useState(SEED_REPORTS);
  const [form, setForm] = useState({ type:"", road:"", desc:"", anonymous:true });
  const [filter, setFilter] = useState("All");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [adminMode, setAdminMode] = useState(false);

  function submit() {
    if (!form.type || !form.road || !form.desc.trim()) { setError("Please fill in all fields."); return; }
    setError("");
    const inc = INCIDENT_TYPES.find(i=>i.id===form.type);
    const now = new Date();
    const newReport = {
      id: nextId++,
      type: inc.label,
      emoji: inc.emoji,
      road: form.road,
      desc: form.desc,
      status: "Pending",
      severity: inc.severity,
      time: now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
      reporter: form.anonymous ? "Anonymous" : "You",
      votes: 0,
    };
    setReports(prev => [newReport, ...prev]);
    setForm({ type:"", road:"", desc:"", anonymous:true });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  }

  function upvote(id) {
    setReports(prev => prev.map(r => r.id === id ? { ...r, votes: r.votes + 1 } : r));
  }

  function changeStatus(id, status) {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }

  const filtered = filter === "All" ? reports : reports.filter(r => r.status === filter);

  const S = {
    page: { backgroundColor:"#0a0f1e", minHeight:"100vh", padding:"28px 32px", fontFamily:"system-ui,sans-serif" },
    label: { fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:6 },
    input: { width:"100%", padding:"10px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, fontSize:13, color:"white", outline:"none", boxSizing:"border-box" },
    select: { width:"100%", padding:"10px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, fontSize:13, color:"white", outline:"none", cursor:"pointer" },
  };

  const stats = {
    total: reports.length,
    verified: reports.filter(r=>r.status==="Verified").length,
    pending: reports.filter(r=>r.status==="Pending").length,
    high: reports.filter(r=>r.severity==="High").length,
  };

  return (
    <>
      
      <style>{`select option,textarea{background:#1a1f2e;color:white} textarea::placeholder,input::placeholder{color:rgba(255,255,255,0.25)} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={S.page}>
        {/* Header */}
        <div style={{ marginBottom:28, display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#ef4444,#f97316)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>📢</div>
            <div>
              <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:"white" }}>Crowd Incident Reporting</h1>
              <p style={{ margin:"4px 0 0", color:"rgba(255,255,255,0.45)", fontSize:14 }}>Report road incidents · Community verification · Admin moderation</p>
            </div>
          </div>
          <button onClick={()=>setAdminMode(!adminMode)} style={{ padding:"8px 18px", background:adminMode?"rgba(139,92,246,0.2)":"rgba(255,255,255,0.06)", border:`1px solid ${adminMode?"rgba(139,92,246,0.5)":"rgba(255,255,255,0.12)"}`, borderRadius:10, color:adminMode?"#a78bfa":"rgba(255,255,255,0.5)", fontSize:12, fontWeight:700, cursor:"pointer" }}>
            {adminMode ? "🔓 Admin Mode" : "🔒 Admin Mode"}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
          {[
            { icon:"📋", label:"Total Reports", value:stats.total,    color:"#38bdf8" },
            { icon:"✅", label:"Verified",       value:stats.verified, color:"#22c55e" },
            { icon:"⏳", label:"Pending Review", value:stats.pending,  color:"#f59e0b" },
            { icon:"🔴", label:"High Severity",  value:stats.high,     color:"#ef4444" },
          ].map(s => (
            <Glass key={s.label} style={{ flex:1, minWidth:120, padding:"16px 20px" }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:28, fontWeight:900, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:4 }}>{s.label}</div>
            </Glass>
          ))}
        </div>

        <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
          {/* Report form */}
          <div style={{ flex:1, minWidth:300 }}>
            <Glass style={{ padding:"24px 28px", marginBottom:20 }}>
              <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:20 }}>📝 Submit Incident Report</div>
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div>
                  <label style={S.label}>Incident Type</label>
                  <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={S.select}>
                    <option value="">-- Select type --</option>
                    {INCIDENT_TYPES.map(t=><option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Road / Location</label>
                  <select value={form.road} onChange={e=>setForm({...form,road:e.target.value})} style={S.select}>
                    <option value="">-- Select road --</option>
                    {ROADS.map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Description</label>
                  <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} rows={3} placeholder="Describe the incident in detail…"
                    style={{ ...S.input, resize:"vertical", fontFamily:"inherit" }} />
                </div>
                <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                  <input type="checkbox" checked={form.anonymous} onChange={e=>setForm({...form,anonymous:e.target.checked})} />
                  <span style={{ fontSize:13, color:"rgba(255,255,255,0.55)" }}>Submit anonymously</span>
                </label>
                {error && <div style={{ padding:"10px 14px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, color:"#f87171", fontSize:13 }}>⚠️ {error}</div>}
                {submitted && <div style={{ padding:"10px 14px", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, color:"#4ade80", fontSize:13 }}>✅ Report submitted! Pending admin review.</div>}
                <button onClick={submit} style={{ padding:"12px", background:"linear-gradient(135deg,#ef4444,#f97316)", color:"white", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 20px rgba(239,68,68,0.3)" }}>
                  📢 Submit Report
                </button>
              </div>
            </Glass>

            {/* Incident type legend */}
            <Glass style={{ padding:"20px 24px" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"white", marginBottom:14 }}>📌 Incident Types</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {INCIDENT_TYPES.map(t => (
                  <div key={t.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:16 }}>{t.emoji}</span>
                      <span style={{ fontSize:13, color:"rgba(255,255,255,0.65)" }}>{t.label}</span>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99, background:`${sevColor(t.severity)}18`, color:sevColor(t.severity) }}>{t.severity}</span>
                  </div>
                ))}
              </div>
            </Glass>
          </div>

          {/* Reports list */}
          <div style={{ flex:2, minWidth:340 }}>
            <Glass style={{ overflow:"hidden" }}>
              <div style={{ padding:"18px 22px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"white" }}>🗂️ Incident Feed</div>
                <div style={{ display:"flex", gap:6 }}>
                  {["All","Verified","Pending","Rejected"].map(f => (
                    <button key={f} onClick={()=>setFilter(f)} style={{ padding:"5px 12px", borderRadius:8, border:"none", fontSize:12, fontWeight:700, cursor:"pointer", background:filter===f?"rgba(139,92,246,0.2)":"transparent", color:filter===f?"#a78bfa":"rgba(255,255,255,0.4)" }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ maxHeight:620, overflowY:"auto", padding:"8px 0" }}>
                {filtered.length === 0 && (
                  <div style={{ textAlign:"center", padding:"40px 20px", color:"rgba(255,255,255,0.3)", fontSize:14 }}>No reports in this category</div>
                )}
                {filtered.map(r => {
                  const sc = statusColor(r.status);
                  return (
                    <div key={r.id} style={{ padding:"16px 22px", borderBottom:"1px solid rgba(255,255,255,0.05)", animation:"fadeUp 0.3s ease" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:20 }}>{r.emoji}</span>
                          <div>
                            <div style={{ fontSize:14, fontWeight:700, color:"white" }}>{r.type}</div>
                            <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:2 }}>📍 {r.road}</div>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                          <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:99, background:`${sevColor(r.severity)}18`, color:sevColor(r.severity) }}>{r.severity}</span>
                          <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:99, background:sc.bg, color:sc.color }}>{r.status}</span>
                        </div>
                      </div>
                      <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", marginBottom:10, lineHeight:1.5 }}>{r.desc}</div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>
                          🕐 {r.time} · 👤 {r.reporter}
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={()=>upvote(r.id)} style={{ padding:"4px 12px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"rgba(255,255,255,0.55)", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                            👍 {r.votes}
                          </button>
                          {adminMode && r.status !== "Verified" && (
                            <button onClick={()=>changeStatus(r.id,"Verified")} style={{ padding:"4px 10px", background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, color:"#4ade80", fontSize:11, fontWeight:700, cursor:"pointer" }}>✓ Verify</button>
                          )}
                          {adminMode && r.status !== "Rejected" && (
                            <button onClick={()=>changeStatus(r.id,"Rejected")} style={{ padding:"4px 10px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, color:"#f87171", fontSize:11, fontWeight:700, cursor:"pointer" }}>✕ Reject</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Glass>
          </div>
        </div>
      </div>
    </>
  );
}
