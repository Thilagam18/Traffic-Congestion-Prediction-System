import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

// ── Navigation groups ──────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Core",
    links: [
      { to: "/dashboard",  label: "Dashboard",   icon: "🏠" },
      { to: "/monitoring", label: "Monitoring",  icon: "📡" },
      { to: "/traffic",    label: "Traffic Data", icon: "🛣️" },
    ],
  },
  {
    label: "AI & Prediction",
    links: [
      { to: "/prediction", label: "Prediction",  icon: "📈" },
      { to: "/explain",    label: "Explain AI",  icon: "🧠" },
      { to: "/future",     label: "Future",      icon: "🔮" },
      { to: "/ml-dashboard", label: "ML Model", icon: "🤖" },
    ],
  },
  {
    label: "Routes & Safety",
    links: [
      { to: "/route",      label: "Route Opt.",  icon: "🗺️" },
      { to: "/compare",    label: "Compare",     icon: "🔀" },
      { to: "/safety",     label: "Safety Index",icon: "🛡️" },
      { to: "/emergency",  label: "Emergency",   icon: "🚨" },
    ],
  },
  {
    label: "Smart City",
    links: [
      { to: "/smart-city", label: "City Analytics", icon: "🏙️" },
      { to: "/analytics",  label: "Analytics",      icon: "📊" },
      { to: "/charts",     label: "Charts",         icon: "📉" },
      { to: "/carbon",     label: "Carbon",         icon: "🌿" },
    ],
  },
  {
    label: "Services",
    links: [
      { to: "/incidents",  label: "Incidents",  icon: "📢" },
      { to: "/parking",    label: "Parking",    icon: "🅿️" },
      { to: "/reports",    label: "Reports",    icon: "📋" },
    ],
  },
];

// Flat list for active detection
const ALL_LINKS = NAV_GROUPS.flatMap(g => g.links);

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}
const FALLBACK = { name: "Admin User", email: "admin@trafficops.io" };

function initials(name) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function Navbar() {
  const location = useLocation();
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropRef = useRef(null);
  const stored = getUser();
  const roleLabel = stored.role === "admin" ? "Administrator" : stored.role === "analyst" ? "Traffic Analyst" : stored.role ? stored.role : "Traffic Administrator";
  const USER = { name: stored.name || FALLBACK.name, email: stored.email || FALLBACK.email, role: roleLabel };

  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setUserOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Find active group
  const activeLink = ALL_LINKS.find(l => location.pathname === l.to);

  return (
    <>
      <style>{`
        .nav-link { transition: all 0.15s ease; }
        .nav-link:hover { color: white !important; background: rgba(255,255,255,0.08) !important; }
        .nav-group-btn:hover { color: white !important; }
        .nav-dropdown { position: absolute; top: calc(100% + 8px); left: 0; z-index: 2000; }
        .nav-dropdown-item:hover { background: rgba(255,255,255,0.08) !important; color: white !important; }
        @keyframes dropIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <nav style={{
        backgroundColor: "#0a0f1e",
        color: "white",
        padding: "0 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: 56,
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 1px 0 rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.4)",
        borderBottom: "1px solid rgba(139,92,246,0.15)",
      }}>
        {/* Logo */}
        <Link to="/dashboard" style={{ textDecoration:"none", display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#8b5cf6,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>✨</div>
          <div style={{ fontSize:14, fontWeight:800, color:"white", letterSpacing:"-0.3px", whiteSpace:"nowrap" }}>
            UrbanMind <span style={{ color:"#8b5cf6" }}>AI</span>
          </div>
        </Link>

        {/* Desktop nav groups */}
        <div style={{ display:"flex", alignItems:"center", gap:2, flex:1, padding:"0 16px", overflowX:"hidden" }}>
          {NAV_GROUPS.map(group => (
            <NavGroup key={group.label} group={group} location={location} />
          ))}
        </div>

        {/* User menu */}
        <div ref={dropRef} style={{ position:"relative", flexShrink:0 }}>
          <button
            onClick={() => setUserOpen(o => !o)}
            style={{
              display:"flex", alignItems:"center", gap:8,
              background: userOpen ? "rgba(255,255,255,0.08)" : "transparent",
              border:"1px solid rgba(255,255,255,0.12)",
              borderRadius:8, padding:"5px 10px 5px 6px",
              cursor:"pointer", color:"white",
            }}
          >
            <div style={{
              width:30, height:30, borderRadius:"50%",
              background:"linear-gradient(135deg,#8b5cf6,#3b82f6)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:11, fontWeight:800, color:"white", flexShrink:0,
            }}>
              {initials(USER.name)}
            </div>
            <div style={{ textAlign:"left", lineHeight:1.3 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"white" }}>{USER.name.split(" ")[0]}</div>
              <div style={{ fontSize:9, color:"rgba(139,92,246,0.8)", textTransform:"capitalize" }}>{stored.role || "admin"}</div>
            </div>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={2.5} strokeLinecap="round"
              style={{ transform:userOpen?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.2s", marginLeft:2 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {userOpen && (
            <div style={{
              position:"absolute", right:0, top:"calc(100% + 8px)",
              background:"#0f172a", border:"1px solid rgba(255,255,255,0.1)",
              borderRadius:12, minWidth:220, boxShadow:"0 16px 40px rgba(0,0,0,0.5)",
              overflow:"hidden", zIndex:2000, animation:"dropIn 0.2s ease",
            }}>
              <div style={{ padding:"14px 16px", background:"rgba(139,92,246,0.1)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#8b5cf6,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"white" }}>
                    {initials(USER.name)}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"white" }}>{USER.name}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{USER.email}</div>
                  </div>
                </div>
                <div style={{ marginTop:8, padding:"3px 8px", background:"rgba(139,92,246,0.2)", borderRadius:99, display:"inline-block" }}>
                  <span style={{ fontSize:10, fontWeight:600, color:"#c4b5fd" }}>🛡️ {USER.role}</span>
                </div>
              </div>

              {[
                { icon:"👤", label:"My Profile",     to:"/profile" },
                { icon:"📋", label:"Reports",         to:"/reports" },
                { icon:"👥", label:"User Management", to:"/users" },
              ].map(({ icon, label, to }) => (
                <Link key={to} to={to} onClick={() => setUserOpen(false)} className="nav-dropdown-item" style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"11px 16px", textDecoration:"none",
                  color:"rgba(255,255,255,0.6)", fontSize:13, fontWeight:500,
                  borderBottom:"1px solid rgba(255,255,255,0.04)",
                }}>
                  <span style={{ fontSize:15 }}>{icon}</span> {label}
                </Link>
              ))}

              <Link to="/" onClick={() => { localStorage.removeItem("user"); setUserOpen(false); }} className="nav-dropdown-item" style={{
                display:"flex", alignItems:"center", gap:10,
                padding:"11px 16px", textDecoration:"none",
                color:"#f87171", fontSize:13, fontWeight:600,
              }}>
                <span style={{ fontSize:15 }}>🚪</span> Sign Out
              </Link>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

// ── Nav group with dropdown ────────────────────────────────────────────────────
function NavGroup({ group, location }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isActive = group.links.some(l => location.pathname === l.to);
  const activeLink = group.links.find(l => location.pathname === l.to);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button
        className="nav-group-btn"
        onClick={() => setOpen(o => !o)}
        style={{
          display:"flex", alignItems:"center", gap:4,
          background: isActive ? "rgba(139,92,246,0.15)" : "transparent",
          border: isActive ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent",
          borderRadius:7, padding:"5px 10px",
          cursor:"pointer", color: isActive ? "#c4b5fd" : "#94a3b8",
          fontSize:12, fontWeight: isActive ? 700 : 400,
          whiteSpace:"nowrap",
        }}
      >
        {activeLink ? `${activeLink.icon} ${activeLink.label}` : group.label}
        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
          style={{ transform:open?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.15s", opacity:0.6 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="nav-dropdown" style={{ animation:"dropIn 0.15s ease" }}>
          <div style={{
            background:"#0f172a", border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:12, minWidth:180, boxShadow:"0 16px 40px rgba(0,0,0,0.5)",
            overflow:"hidden",
          }}>
            <div style={{ padding:"8px 12px", borderBottom:"1px solid rgba(255,255,255,0.05)", fontSize:10, fontWeight:700, color:"rgba(139,92,246,0.6)", textTransform:"uppercase", letterSpacing:"0.08em" }}>
              {group.label}
            </div>
            {group.links.map(link => {
              const isLinkActive = location.pathname === link.to;
              return (
                <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="nav-dropdown-item" style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"10px 14px", textDecoration:"none",
                  color: isLinkActive ? "#c4b5fd" : "rgba(255,255,255,0.55)",
                  fontSize:13, fontWeight: isLinkActive ? 700 : 400,
                  background: isLinkActive ? "rgba(139,92,246,0.12)" : "transparent",
                  borderBottom:"1px solid rgba(255,255,255,0.03)",
                }}>
                  <span style={{ fontSize:15 }}>{link.icon}</span>
                  {link.label}
                  {isLinkActive && <span style={{ marginLeft:"auto", fontSize:10, color:"#8b5cf6" }}>●</span>}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
