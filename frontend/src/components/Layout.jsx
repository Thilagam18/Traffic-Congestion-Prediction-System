import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { icon: "🏠", label: "Dashboard",       path: "/dashboard"   },
      { icon: "📡", label: "Live Monitoring",  path: "/monitoring"  },
      { icon: "🛣️", label: "Traffic Data",    path: "/traffic"     },
    ],
  },
  {
    label: "AI & Prediction",
    items: [
      { icon: "📈", label: "Traffic Prediction", path: "/prediction"    },
      { icon: "🧠", label: "Explainable AI",     path: "/explain"       },
      { icon: "🔮", label: "Future Forecast",    path: "/future"        },
      { icon: "🤖", label: "ML Dashboard",       path: "/ml-dashboard"  },
    ],
  },
  {
    label: "Routes & Safety",
    items: [
      { icon: "🗺️", label: "Route Optimization", path: "/route"     },
      { icon: "🔀", label: "Route Comparison",   path: "/compare"   },
      { icon: "🛡️", label: "Safety Index",       path: "/safety"    },
      { icon: "🚨", label: "Emergency",           path: "/emergency" },
    ],
  },
  {
    label: "Smart City",
    items: [
      { icon: "🏙️", label: "City Analytics",  path: "/smart-city" },
      { icon: "📊", label: "Analytics",        path: "/analytics"  },
      { icon: "📉", label: "Charts",           path: "/charts"     },
      { icon: "🌿", label: "Carbon Emission",  path: "/carbon"     },
    ],
  },
  {
    label: "Services",
    items: [
      { icon: "📢", label: "Incidents",  path: "/incidents" },
      { icon: "🅿️", label: "Parking",   path: "/parking"   },
      { icon: "📋", label: "Reports",    path: "/reports"   },
    ],
  },
  {
    label: "Admin",
    items: [
      { icon: "👥", label: "User Management", path: "/users" },
    ],
  },
];

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}
function initials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const user = getUser();
  const W = collapsed ? 64 : 240;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <style>{`
        .sl-link { transition: background 0.14s, color 0.14s; }
        .sl-link:hover { background: rgba(139,92,246,0.12) !important; color: #c4b5fd !important; }
        .sl-link.sl-active { background: rgba(139,92,246,0.2) !important; color: #c4b5fd !important; border-left: 3px solid #8b5cf6 !important; }
        .sl-collapse-btn:hover { background: rgba(255,255,255,0.08) !important; }
        .sl-logout:hover { background: rgba(239,68,68,0.15) !important; }
        .sl-profile:hover { background: rgba(255,255,255,0.1) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={{
        position: "fixed", left: 0, top: 0, bottom: 0,
        width: W, background: "#0a0f1e",
        borderRight: "1px solid rgba(139,92,246,0.12)",
        display: "flex", flexDirection: "column",
        zIndex: 600, overflowY: "auto", overflowX: "hidden",
        transition: "width 0.22s ease",
        boxShadow: "2px 0 24px rgba(0,0,0,0.35)",
      }}>

        {/* Logo row */}
        <div style={{
          padding: collapsed ? "14px 0" : "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 10, flexShrink: 0,
        }}>
          {!collapsed ? (
            <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", flex: 1, minWidth: 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#8b5cf6,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>✨</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "white", letterSpacing: "-0.3px", whiteSpace: "nowrap" }}>
                  Traffic <span style={{ color: "#8b5cf6" }}>Prediction</span>
                </div>
                <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.28)" }}>Smart Intelligence</div>
              </div>
            </Link>
          ) : (
            <Link to="/dashboard" style={{ textDecoration: "none" }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#8b5cf6,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✨</div>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="sl-collapse-btn"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, cursor: "pointer", color: "rgba(255,255,255,0.4)", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: collapsed ? "6px 6px" : "6px 10px", overflowY: "auto" }}>
          {NAV_SECTIONS.map((section, si) => (
            <div key={section.label}>
              {!collapsed && (
                <div style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(139,92,246,0.45)", textTransform: "uppercase", letterSpacing: "0.12em", padding: "10px 8px 3px", marginTop: si === 0 ? 2 : 6 }}>
                  {section.label}
                </div>
              )}
              {collapsed && si > 0 && <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "6px 4px" }} />}
              {section.items.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={`sl-link${isActive ? " sl-active" : ""}`}
                    style={{
                      display: "flex", alignItems: "center",
                      gap: collapsed ? 0 : 9,
                      justifyContent: collapsed ? "center" : "flex-start",
                      padding: collapsed ? "9px 0" : "8px 10px",
                      borderRadius: collapsed ? 8 : 7,
                      borderLeft: isActive && !collapsed ? "3px solid #8b5cf6" : "3px solid transparent",
                      textDecoration: "none",
                      color: isActive ? "#c4b5fd" : "rgba(255,255,255,0.5)",
                      fontWeight: isActive ? 600 : 400,
                      fontSize: 12.5,
                      background: isActive ? "rgba(139,92,246,0.18)" : "transparent",
                      marginBottom: 1,
                    }}
                  >
                    <span style={{ fontSize: collapsed ? 17 : 15, flexShrink: 0 }}>{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
                        {isActive && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#8b5cf6", flexShrink: 0 }} />}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: collapsed ? "10px 6px" : "10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8, padding: "6px 8px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#8b5cf6,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "white", flexShrink: 0 }}>
                {initials(user.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name || "Guest"}</div>
                <div style={{ fontSize: 10, color: "rgba(139,92,246,0.7)", textTransform: "capitalize" }}>{user.role || "viewer"}</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <div title={user.name} style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#8b5cf6,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "white", cursor: "pointer" }} onClick={() => navigate("/profile")}>
                {initials(user.name)}
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 5, flexDirection: collapsed ? "column" : "row", alignItems: "stretch" }}>
            <Link
              to="/profile"
              className="sl-profile"
              title="Profile"
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 8px", borderRadius: 7, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)", textDecoration: "none", fontSize: 11.5, fontWeight: 600 }}
            >
              👤{!collapsed && " Profile"}
            </Link>
            <button
              onClick={() => { localStorage.removeItem("user"); navigate("/"); }}
              className="sl-logout"
              title="Sign out"
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 8px", borderRadius: 7, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.12)", color: "#f87171", cursor: "pointer", fontSize: 11.5, fontWeight: 600 }}
            >
              🚪{!collapsed && " Sign out"}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ marginLeft: W, flex: 1, minHeight: "100vh", transition: "margin-left 0.22s ease", display: "flex", flexDirection: "column" }}>
        <Outlet />
      </main>
    </div>
  );
}
