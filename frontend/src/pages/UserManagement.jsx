import React, { useState, useMemo } from "react";
import Navbar from "../components/Navbar";

const ALL_USERS = [
  { id: 1, name: "Admin User",       email: "admin@urbanmind.ai",   role: "Admin",   status: "Active",    lastLogin: "2 min ago",    joined: "Jan 2024" },
  { id: 2, name: "Traffic Analyst",  email: "analyst@urbanmind.ai", role: "Analyst", status: "Active",    lastLogin: "1 hr ago",     joined: "Mar 2024" },
  { id: 3, name: "Demo Viewer",      email: "demo@urbanmind.ai",    role: "Viewer",  status: "Active",    lastLogin: "3 hrs ago",    joined: "Apr 2024" },
  { id: 4, name: "Traffic Officer",  email: "officer@citynet.gov",  role: "Analyst", status: "Active",    lastLogin: "Yesterday",    joined: "Feb 2024" },
  { id: 5, name: "City Manager",     email: "manager@citynet.gov",  role: "Admin",   status: "Inactive",  lastLogin: "5 days ago",   joined: "Jan 2024" },
  { id: 6, name: "Jane Doe",         email: "jane@example.com",     role: "Viewer",  status: "Active",    lastLogin: "2 days ago",   joined: "May 2024" },
  { id: 7, name: "Carlos Rivera",    email: "carlos@smartcity.io",  role: "Analyst", status: "Suspended", lastLogin: "2 weeks ago",  joined: "Jun 2024" },
  { id: 8, name: "Aisha Malik",      email: "aisha@urbanmind.ai",   role: "Admin",   status: "Active",    lastLogin: "Just now",     joined: "Jul 2024" },
];

const ROLE_META = {
  Admin:   { color: "#a78bfa", bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.3)", icon: "🛡️" },
  Analyst: { color: "#60a5fa", bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.3)", icon: "📊" },
  Viewer:  { color: "#34d399", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.3)", icon: "👁️" },
};

const STATUS_META = {
  Active:    { color: "#4ade80", dot: "#22c55e" },
  Inactive:  { color: "rgba(255,255,255,0.4)", dot: "#6b7280" },
  Suspended: { color: "#f87171", dot: "#ef4444" },
};

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState(new Set());

  const currentUser = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
  const isAdmin = currentUser.role === "admin" || currentUser.role === "Admin";

  const filtered = useMemo(() => {
    return ALL_USERS.filter(u => {
      const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole   = roleFilter === "All" || u.role === roleFilter;
      const matchStatus = statusFilter === "All" || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [search, roleFilter, statusFilter]);

  const stats = useMemo(() => ({
    total:    ALL_USERS.length,
    active:   ALL_USERS.filter(u => u.status === "Active").length,
    admins:   ALL_USERS.filter(u => u.role === "Admin").length,
    analysts: ALL_USERS.filter(u => u.role === "Analyst").length,
  }), []);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(u => u.id)));
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .um-row { transition: background 0.15s; }
        .um-row:hover { background: rgba(139,92,246,0.06) !important; }
        .um-filter-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); padding: 6px 14px; border-radius: 20px; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.15s; font-family: inherit; }
        .um-filter-btn:hover, .um-filter-btn.active { background: rgba(139,92,246,0.18); border-color: rgba(139,92,246,0.4); color: #c4b5fd; }
        .um-search { width:100%; padding:10px 16px 10px 40px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:white; font-size:13px; outline:none; transition:border-color 0.2s; font-family:inherit; }
        .um-search:focus { border-color: rgba(139,92,246,0.5); }
        .um-search::placeholder { color: rgba(255,255,255,0.28); }
        .um-checkbox { width:16px; height:16px; accent-color:#8b5cf6; cursor:pointer; }
      `}</style>

      <div style={{ background: "#0a0f1e", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <Navbar />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px", animation: "fadeIn 0.4s ease" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#8b5cf6,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👥</div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "white", margin: 0 }}>User Management</h1>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>Manage platform access, roles, and user permissions</p>
            </div>
            {isAdmin && (
              <button style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg,#8b5cf6,#3b82f6)",
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontFamily: "inherit",
              }}>
                <span>+</span> Invite User
              </button>
            )}
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
            {[
              { label: "Total Users",    value: stats.total,    icon: "👥", color: "#8b5cf6" },
              { label: "Active",         value: stats.active,   icon: "🟢", color: "#22c55e" },
              { label: "Admins",         value: stats.admins,   icon: "🛡️",  color: "#a78bfa" },
              { label: "Analysts",       value: stats.analysts, icon: "📊", color: "#60a5fa" },
            ].map(s => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: "18px 20px",
              }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: "18px 20px",
            marginBottom: 16,
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            alignItems: "center",
          }}>
            {/* Search */}
            <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.4 }}>🔍</span>
              <input
                type="text"
                className="um-search"
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Role filter */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["All", "Admin", "Analyst", "Viewer"].map(r => (
                <button key={r} className={`um-filter-btn${roleFilter === r ? " active" : ""}`} onClick={() => setRoleFilter(r)}>{r}</button>
              ))}
            </div>

            {/* Status filter */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["All", "Active", "Inactive", "Suspended"].map(s => (
                <button key={s} className={`um-filter-btn${statusFilter === s ? " active" : ""}`} onClick={() => setStatusFilter(s)}>{s}</button>
              ))}
            </div>

            <div style={{ marginLeft: "auto", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
              {filtered.length} of {ALL_USERS.length} users
            </div>
          </div>

          {/* Table */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            overflow: "hidden",
          }}>
            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
              <div style={{
                padding: "12px 20px",
                background: "rgba(139,92,246,0.12)",
                borderBottom: "1px solid rgba(139,92,246,0.2)",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}>
                <span style={{ fontSize: 13, color: "#c4b5fd", fontWeight: 600 }}>{selectedIds.size} selected</span>
                <button onClick={() => setSelectedIds(new Set())} style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Clear</button>
                {isAdmin && (
                  <>
                    <button style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Suspend</button>
                    <button style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Remove</button>
                  </>
                )}
              </div>
            )}

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <th style={{ padding: "14px 20px", textAlign: "left", width: 44 }}>
                      <input type="checkbox" className="um-checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleAll} />
                    </th>
                    {["User", "Role", "Status", "Last Login", "Joined"].map(h => (
                      <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                    {isAdmin && <th style={{ padding: "14px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} style={{ padding: "48px 20px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
                        No users match your filters.
                      </td>
                    </tr>
                  ) : filtered.map((user, i) => {
                    const role = ROLE_META[user.role] || ROLE_META.Viewer;
                    const status = STATUS_META[user.status] || STATUS_META.Inactive;
                    const initials = user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
                    const selected = selectedIds.has(user.id);
                    return (
                      <tr key={user.id} className="um-row" style={{
                        borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        background: selected ? "rgba(139,92,246,0.06)" : "transparent",
                      }}>
                        <td style={{ padding: "14px 20px" }}>
                          <input type="checkbox" className="um-checkbox" checked={selected} onChange={() => toggleSelect(user.id)} />
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: "50%",
                              background: `linear-gradient(135deg, ${role.color}55, ${role.color}22)`,
                              border: `1px solid ${role.border}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 13, fontWeight: 700, color: role.color, flexShrink: 0,
                            }}>
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{user.name}</div>
                              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "4px 10px",
                            background: role.bg, border: `1px solid ${role.border}`,
                            borderRadius: 99, fontSize: 11, fontWeight: 600, color: role.color,
                          }}>
                            <span>{role.icon}</span> {user.role}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: status.dot, display: "inline-block", flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: status.color, fontWeight: 500 }}>{user.status}</span>
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{user.lastLogin}</td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{user.joined}</td>
                        {isAdmin && (
                          <td style={{ padding: "14px 16px", textAlign: "right" }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                              <button style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }} title="Edit">✏️</button>
                              <button style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }} title="Remove">🗑️</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
