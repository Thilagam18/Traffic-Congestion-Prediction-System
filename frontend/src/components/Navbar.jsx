import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { to: "/dashboard",   label: "Dashboard" },
  { to: "/traffic",     label: "Traffic Data" },
  { to: "/analytics",   label: "Analytics" },
  { to: "/charts",      label: "Charts" },
  { to: "/prediction",  label: "Prediction" },
  { to: "/monitoring",  label: "Monitoring" },
  { to: "/route",       label: "Routes" },
  { to: "/reports",     label: "Reports" },
];

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}
const FALLBACK = { name: "Admin User", email: "admin@trafficops.io" };

function initials(name) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);
  const stored = getUser();
  const USER = { name: stored.name || FALLBACK.name, email: stored.email || FALLBACK.email, role: "Traffic Administrator" };

  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav style={{
      backgroundColor: "#0f172a",
      color: "white",
      padding: "0 24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      height: 56,
      position: "sticky",
      top: 0,
      zIndex: 1000,
      boxShadow: "0 1px 6px rgba(0,0,0,0.4)",
    }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: "white", whiteSpace: "nowrap", letterSpacing: "-0.3px" }}>
        🚦 TrafficOps
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 2, overflowX: "auto", flex: 1, padding: "0 24px" }}>
        {NAV_LINKS.map(({ to, label }) => {
          const active = location.pathname === to;
          return (
            <Link key={to} to={to} style={{
              color: active ? "white" : "#94a3b8",
              textDecoration: "none",
              padding: "6px 11px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: active ? 700 : 400,
              background: active ? "rgba(255,255,255,0.12)" : "transparent",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
              onMouseEnter={e => { if (!active) e.target.style.color = "white"; }}
              onMouseLeave={e => { if (!active) e.target.style.color = "#94a3b8"; }}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div ref={dropRef} style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            background: open ? "rgba(255,255,255,0.12)" : "transparent",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 8, padding: "5px 10px 5px 6px",
            cursor: "pointer", color: "white",
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800, color: "white", flexShrink: 0,
          }}>
            {initials(USER.name)}
          </div>
          <div style={{ textAlign: "left", lineHeight: 1.3 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{USER.name}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{USER.role}</div>
          </div>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={2.5} strokeLinecap="round"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", marginLeft: 2 }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open && (
          <div style={{
            position: "absolute", right: 0, top: "calc(100% + 8px)",
            background: "white", border: "1px solid #e5e7eb",
            borderRadius: 12, minWidth: 220, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            overflow: "hidden", zIndex: 2000,
          }}>
            <div style={{ padding: "14px 16px", background: "#f8fafc", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800, color: "white",
                }}>
                  {initials(USER.name)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{USER.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{USER.email}</div>
                </div>
              </div>
              <div style={{ marginTop: 8, padding: "3px 8px", background: "#dbeafe", borderRadius: 99, display: "inline-block" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#1d4ed8" }}>🛡️ {USER.role}</span>
              </div>
            </div>

            {[
              { icon: "👤", label: "My Profile",    to: "/profile" },
              { icon: "📊", label: "Reports",       to: "/reports" },
              { icon: "⚙️", label: "Users & Perms", to: "/users" },
            ].map(({ icon, label, to }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "11px 16px", textDecoration: "none",
                color: "#374151", fontSize: 13, fontWeight: 500,
                borderBottom: "1px solid #f9fafb",
                transition: "background 0.1s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ fontSize: 16 }}>{icon}</span> {label}
              </Link>
            ))}

            <Link to="/" onClick={() => setOpen(false)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "11px 16px", textDecoration: "none",
              color: "#dc2626", fontSize: 13, fontWeight: 600,
              transition: "background 0.1s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: 16 }}>🚪</span> Logout
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
