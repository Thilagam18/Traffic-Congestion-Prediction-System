import React, { useState, useEffect } from "react";

// ── Full 20-road network (all pre-loaded) ─────────────────────────────────────
const ALL_ROADS = [
  { name: "Downtown Main Street",      type: "City Road",  baseLoad: 0.80 },
  { name: "North Ring Road",            type: "Ring Road",  baseLoad: 0.65 },
  { name: "East Highway I-42",          type: "Highway",    baseLoad: 0.70 },
  { name: "West Bridge Corridor",       type: "Bridge",     baseLoad: 0.55 },
  { name: "Central Avenue",             type: "City Road",  baseLoad: 0.75 },
  { name: "South Bypass Expressway",    type: "Expressway", baseLoad: 0.50 },
  { name: "Industrial Park Road",       type: "City Road",  baseLoad: 0.40 },
  { name: "Airport Link Highway",       type: "Highway",    baseLoad: 0.60 },
  { name: "Riverside Drive",            type: "City Road",  baseLoad: 0.35 },
  { name: "Market District Road",       type: "City Road",  baseLoad: 0.85 },
  { name: "Commerce Boulevard",         type: "City Road",  baseLoad: 0.72 },
  { name: "University Avenue",          type: "City Road",  baseLoad: 0.58 },
  { name: "Harbor Tunnel Approach",     type: "Tunnel",     baseLoad: 0.68 },
  { name: "Suburban Link Road",         type: "Suburban",   baseLoad: 0.45 },
  { name: "Tech Park Connector",        type: "City Road",  baseLoad: 0.52 },
  { name: "Old Town Quarter Street",    type: "City Road",  baseLoad: 0.63 },
  { name: "Sports Complex Drive",       type: "City Road",  baseLoad: 0.42 },
  { name: "Green Valley Expressway",    type: "Expressway", baseLoad: 0.55 },
  { name: "Northern Heights Boulevard", type: "Boulevard",  baseLoad: 0.60 },
  { name: "Waterfront Promenade",       type: "City Road",  baseLoad: 0.38 },
];

const ROAD_TYPES = ["All Types", ...Array.from(new Set(ALL_ROADS.map(r => r.type))).sort()];

// ── Data generation ───────────────────────────────────────────────────────────
function getTimeFactor() {
  const h = new Date().getHours(), d = new Date().getDay();
  if (d === 0 || d === 6) return 0.45;
  if (h >= 7  && h <= 9)  return 1.0;
  if (h >= 17 && h <= 19) return 0.95;
  if (h >= 10 && h <= 16) return 0.65;
  if (h >= 20 || h <= 6)  return 0.25;
  return 0.6;
}

function generateSensorData(roadName, baseLoad = 0.5) {
  const tf = getTimeFactor();
  const rawLoad = Math.min(0.98, baseLoad * tf + Math.random() * 0.12);
  const vehicleCount = Math.round(rawLoad * 1800 + Math.random() * 150);
  const congestion = Math.round(rawLoad * 100);
  const speed = Math.round((1 - rawLoad * 0.85) * 110 + 10);
  const capacity = Math.round(baseLoad * 2200);
  let status, statusColor, statusBg, barColor;
  if      (congestion >= 75) { status = "Severe";   statusColor = "#dc2626"; statusBg = "#fef2f2"; barColor = "#ef4444"; }
  else if (congestion >= 50) { status = "High";     statusColor = "#ea580c"; statusBg = "#fff7ed"; barColor = "#f97316"; }
  else if (congestion >= 25) { status = "Moderate"; statusColor = "#d97706"; statusBg = "#fffbeb"; barColor = "#f59e0b"; }
  else                       { status = "Clear";    statusColor = "#16a34a"; statusBg = "#f0fdf4"; barColor = "#22c55e"; }
  return { vehicleCount, congestion, speed, capacity, status, statusColor, statusBg, barColor };
}

// Build initial roads — ALL 20 pre-loaded
const INITIAL_ROADS = ALL_ROADS.map((r, i) => ({
  id: i + 1,
  roadName: r.name,
  type: r.type,
  baseLoad: r.baseLoad,
  addedAt: new Date(Date.now() - (ALL_ROADS.length - i) * 3 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  ...generateSensorData(r.name, r.baseLoad),
}));

// ── Export CSV ────────────────────────────────────────────────────────────────
function exportCSV(roads) {
  const header = ["Road", "Type", "Congestion %", "Vehicles/hr", "Avg Speed km/h", "Capacity", "Status", "Added"];
  const rows = roads.map(r => [r.roadName, r.type, r.congestion, r.vehicleCount, r.speed, r.capacity, r.status, r.addedAt]);
  const csv = [header, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `traffic_data_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

// ── Type badge ────────────────────────────────────────────────────────────────
const TYPE_COLORS = {
  "Highway":    { bg: "#eff6ff", color: "#1d4ed8" },
  "Expressway": { bg: "#f5f3ff", color: "#6d28d9" },
  "Ring Road":  { bg: "#fdf4ff", color: "#9333ea" },
  "City Road":  { bg: "#f8fafc", color: "#475569" },
  "Bridge":     { bg: "#fff7ed", color: "#c2410c" },
  "Tunnel":     { bg: "#1e293b", color: "#e2e8f0" },
  "Suburban":   { bg: "#f0fdf4", color: "#15803d" },
  "Boulevard":  { bg: "#fef9c3", color: "#854d0e" },
};
function TypeBadge({ type }) {
  const s = TYPE_COLORS[type] || { bg: "#f3f4f6", color: "#6b7280" };
  return <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>{type}</span>;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatusBadge({ status, statusColor, statusBg }) {
  return <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: statusBg, color: statusColor, whiteSpace: "nowrap" }}>{status}</span>;
}
function CongestionBar({ value, barColor }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 110 }}>
      <div style={{ flex: 1, background: "#e5e7eb", borderRadius: 99, height: 7, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: barColor, borderRadius: 99, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: barColor, minWidth: 30 }}>{value}%</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TrafficManagement() {
  const [roads, setRoads] = useState(INITIAL_ROADS);
  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState("City Road");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [sortBy, setSortBy] = useState("congestion");
  const [sortDir, setSortDir] = useState("desc");
  const [adding, setAdding] = useState(false);
  const [flash, setFlash] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showAddPanel, setShowAddPanel] = useState(false);

  // Auto-refresh every 45s
  useEffect(() => {
    const t = setInterval(() => {
      setRoads(prev => prev.map(r => ({ ...r, ...generateSensorData(r.roadName, r.baseLoad) })));
      setLastRefresh(new Date());
    }, 45000);
    return () => clearInterval(t);
  }, []);

  const handleAdd = () => {
    const name = customName.trim();
    if (!name) return;
    if (roads.find(r => r.roadName.toLowerCase() === name.toLowerCase())) {
      alert("This road is already being monitored.");
      return;
    }
    setAdding(true);
    setTimeout(() => {
      const newRoad = {
        id: Date.now(),
        roadName: name,
        type: customType,
        baseLoad: 0.5,
        addedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        ...generateSensorData(name, 0.5),
      };
      setRoads(prev => [newRoad, ...prev]);
      setFlash(newRoad.id);
      setTimeout(() => setFlash(null), 2000);
      setCustomName("");
      setAdding(false);
      setShowAddPanel(false);
    }, 600);
  };

  const handleDelete = (id) => setRoads(prev => prev.filter(r => r.id !== id));
  const handleRefresh = (id) => setRoads(prev => prev.map(r => r.id === id ? { ...r, ...generateSensorData(r.roadName, r.baseLoad) } : r));
  const handleRefreshAll = () => {
    setRoads(prev => prev.map(r => ({ ...r, ...generateSensorData(r.roadName, r.baseLoad) })));
    setLastRefresh(new Date());
  };

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const severe  = roads.filter(r => r.status === "Severe").length;
  const high    = roads.filter(r => r.status === "High").length;
  const avgCong = roads.length ? Math.round(roads.reduce((s, r) => s + r.congestion, 0) / roads.length) : 0;
  const avgSpeed = roads.length ? Math.round(roads.reduce((s, r) => s + r.speed, 0) / roads.length) : 0;
  const totalVeh = roads.reduce((s, r) => s + r.vehicleCount, 0);
  const clearCount = roads.filter(r => r.status === "Clear").length;

  const COLS = [
    { key: "roadName",     label: "Road" },
    { key: "type",         label: "Type" },
    { key: "congestion",   label: "Congestion" },
    { key: "vehicleCount", label: "Vehicles/hr" },
    { key: "speed",        label: "Avg Speed" },
    { key: "status",       label: "Status" },
    { key: "addedAt",      label: "Loaded" },
  ];

  const filtered = roads
    .filter(r => statusFilter === "All"       || r.status === statusFilter)
    .filter(r => typeFilter   === "All Types"  || r.type   === typeFilter)
    .filter(r => r.roadName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let va = a[sortBy], vb = b[sortBy];
      if (typeof va === "string") { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  return (
    <>
      
      <div style={{ padding: "24px 32px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, color: "#0f172a" }}>Traffic Data Management</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
              <strong>{roads.length}</strong> roads monitored · Auto-refreshed at {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => exportCSV(roads)} style={{ padding: "8px 16px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ⬇ Export CSV
            </button>
            <button onClick={() => setShowAddPanel(v => !v)} style={{ padding: "8px 16px", background: showAddPanel ? "#eff6ff" : "white", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ➕ Add Custom Road
            </button>
            <button onClick={handleRefreshAll} style={{ padding: "8px 18px", background: "#1e3a5f", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ↻ Refresh All Sensors
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { icon: "🛣️", label: "Roads Monitored",   value: roads.length,               color: "#1e3a5f", sub: "all types" },
            { icon: "📊", label: "Avg Congestion",     value: `${avgCong}%`,              color: avgCong >= 60 ? "#dc2626" : avgCong >= 35 ? "#d97706" : "#16a34a", sub: "across all roads" },
            { icon: "🚗", label: "Total Vehicles/hr",  value: totalVeh.toLocaleString(),  color: "#0891b2", sub: "combined volume" },
            { icon: "⚡", label: "Avg Speed",          value: `${avgSpeed} km/h`,         color: "#7c3aed", sub: "network average" },
            { icon: "🟢", label: "Clear Roads",        value: clearCount,                 color: "#16a34a", sub: `${severe} severe · ${high} high` },
            { icon: "⚠️", label: "Needs Attention",    value: severe + high,              color: severe > 0 ? "#dc2626" : "#d97706", sub: "severe or high" },
          ].map(({ icon, label, value, color, sub }) => (
            <div key={label} style={{ flex: 1, minWidth: 120, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 18px" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginTop: 2 }}>{label}</div>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Add Custom Road Panel (collapsible) */}
        {showAddPanel && (
          <div style={{ background: "white", border: "1px solid #bfdbfe", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>➕ Add Custom Road to Monitor</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 2, minWidth: 220 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Road Name</label>
                <input
                  type="text"
                  placeholder="e.g. Port Authority Access Road"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAdd()}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
              <div style={{ minWidth: 160 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Road Type</label>
                <select
                  value={customType}
                  onChange={e => setCustomType(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }}
                >
                  {["City Road", "Highway", "Expressway", "Ring Road", "Bridge", "Tunnel", "Suburban", "Boulevard"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <button
                onClick={handleAdd}
                disabled={adding || !customName.trim()}
                style={{ padding: "10px 22px", background: adding || !customName.trim() ? "#93c5fd" : "#2563eb", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: adding || !customName.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
              >
                {adding ? "⏳ Scanning…" : "Add & Auto-Scan"}
              </button>
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 12, color: "#9ca3af" }}>
              Sensor data (vehicles, congestion, speed) is auto-generated from the road type and current time of day.
            </p>
          </div>
        )}

        {/* Table */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>

          {/* Controls */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>
                🚦 Live Sensor Data — All {roads.length} Roads
                {filtered.length < roads.length && <span style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af", marginLeft: 8 }}>({filtered.length} shown)</span>}
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search roads…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ padding: "7px 12px 7px 32px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, width: 180 }}
                />
              </div>
            </div>
            {/* Filter pills */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginRight: 4 }}>STATUS:</span>
              {["All", "Clear", "Moderate", "High", "Severe"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                  padding: "3px 10px", borderRadius: 99, border: "1px solid", fontSize: 11, fontWeight: 600, cursor: "pointer",
                  borderColor: statusFilter === s ? "#2563eb" : "#e5e7eb",
                  background: statusFilter === s ? "#2563eb" : "white",
                  color: statusFilter === s ? "white" : "#6b7280",
                }}>{s}</button>
              ))}
              <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginLeft: 8, marginRight: 4 }}>TYPE:</span>
              {ROAD_TYPES.map(t => (
                <button key={t} onClick={() => setTypeFilter(t)} style={{
                  padding: "3px 10px", borderRadius: 99, border: "1px solid", fontSize: 11, fontWeight: 600, cursor: "pointer",
                  borderColor: typeFilter === t ? "#7c3aed" : "#e5e7eb",
                  background: typeFilter === t ? "#7c3aed" : "white",
                  color: typeFilter === t ? "white" : "#6b7280",
                }}>{t}</button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {COLS.map(col => (
                    <th key={col.key} onClick={() => toggleSort(col.key)} style={{
                      padding: "10px 14px", textAlign: "left", color: "#6b7280", fontWeight: 600, fontSize: 11,
                      textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb",
                      whiteSpace: "nowrap", cursor: "pointer", userSelect: "none",
                    }}>
                      {col.label} {sortBy === col.key && (sortDir === "asc" ? "↑" : "↓")}
                    </th>
                  ))}
                  <th style={{ padding: "10px 14px", textAlign: "center", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>No roads match your filters.</td></tr>
                )}
                {filtered.map((road, i) => {
                  const isFlash = flash === road.id;
                  return (
                    <tr key={road.id}
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none", background: isFlash ? "#eff6ff" : "white", transition: "background 0.5s" }}
                      onMouseEnter={e => { if (!isFlash) e.currentTarget.style.background = "#f8fafc"; }}
                      onMouseLeave={e => { if (!isFlash) e.currentTarget.style.background = "white"; }}
                    >
                      <td style={{ padding: "11px 14px", fontWeight: 700, color: "#111", whiteSpace: "nowrap" }}>{road.roadName}</td>
                      <td style={{ padding: "11px 14px" }}><TypeBadge type={road.type} /></td>
                      <td style={{ padding: "11px 14px", minWidth: 130 }}>
                        <CongestionBar value={road.congestion} barColor={road.barColor} />
                      </td>
                      <td style={{ padding: "11px 14px", color: "#374151", fontWeight: 500 }}>{road.vehicleCount.toLocaleString()}</td>
                      <td style={{ padding: "11px 14px", color: "#374151" }}>{road.speed} km/h</td>
                      <td style={{ padding: "11px 14px" }}><StatusBadge status={road.status} statusColor={road.statusColor} statusBg={road.statusBg} /></td>
                      <td style={{ padding: "11px 14px", color: "#9ca3af", fontSize: 12 }}>{road.addedAt}</td>
                      <td style={{ padding: "11px 14px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button onClick={() => handleRefresh(road.id)} title="Refresh sensor" style={{ padding: "4px 10px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 700 }}>↻</button>
                          <button onClick={() => handleDelete(road.id)} title="Remove road" style={{ padding: "4px 10px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 700 }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ padding: "10px 16px", borderTop: "1px solid #f3f4f6", background: "#f8fafc", fontSize: 11, color: "#9ca3af", display: "flex", justifyContent: "space-between" }}>
            <span>Showing {filtered.length} of {roads.length} roads · All pre-loaded at session start</span>
            <span>Click headers to sort · ↻ refresh sensor · ✕ remove road</span>
          </div>
        </div>
      </div>
    </>
  );
}
