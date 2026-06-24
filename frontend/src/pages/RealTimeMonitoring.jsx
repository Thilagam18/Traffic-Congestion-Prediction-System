import React, { useState, useEffect, useRef, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Navbar from "../components/Navbar";

// ── Full 20-road network with map coordinates ─────────────────────────────────
const BASE_ROADS = [
  { id:  1, name: "Downtown Main Street",      type: "City Road",  baseLoad: 0.80, lat: 51.515,  lon: -0.090 },
  { id:  2, name: "North Ring Road",            type: "Ring Road",  baseLoad: 0.65, lat: 51.535,  lon: -0.090 },
  { id:  3, name: "East Highway I-42",          type: "Highway",    baseLoad: 0.70, lat: 51.510,  lon: -0.060 },
  { id:  4, name: "West Bridge Corridor",       type: "Bridge",     baseLoad: 0.55, lat: 51.510,  lon: -0.120 },
  { id:  5, name: "Central Avenue",             type: "City Road",  baseLoad: 0.75, lat: 51.508,  lon: -0.095 },
  { id:  6, name: "South Bypass Expressway",    type: "Expressway", baseLoad: 0.50, lat: 51.490,  lon: -0.090 },
  { id:  7, name: "Industrial Park Road",       type: "City Road",  baseLoad: 0.40, lat: 51.495,  lon: -0.075 },
  { id:  8, name: "Airport Link Highway",       type: "Highway",    baseLoad: 0.60, lat: 51.480,  lon: -0.110 },
  { id:  9, name: "Riverside Drive",            type: "City Road",  baseLoad: 0.35, lat: 51.512,  lon: -0.085 },
  { id: 10, name: "Market District Road",       type: "City Road",  baseLoad: 0.85, lat: 51.518,  lon: -0.095 },
  { id: 11, name: "Commerce Boulevard",         type: "City Road",  baseLoad: 0.72, lat: 51.505,  lon: -0.100 },
  { id: 12, name: "University Avenue",          type: "City Road",  baseLoad: 0.58, lat: 51.522,  lon: -0.080 },
  { id: 13, name: "Harbor Tunnel Approach",     type: "Tunnel",     baseLoad: 0.68, lat: 51.500,  lon: -0.065 },
  { id: 14, name: "Suburban Link Road",         type: "Suburban",   baseLoad: 0.45, lat: 51.540,  lon: -0.070 },
  { id: 15, name: "Tech Park Connector",        type: "City Road",  baseLoad: 0.52, lat: 51.498,  lon: -0.070 },
  { id: 16, name: "Old Town Quarter Street",    type: "City Road",  baseLoad: 0.63, lat: 51.515,  lon: -0.100 },
  { id: 17, name: "Sports Complex Drive",       type: "City Road",  baseLoad: 0.42, lat: 51.525,  lon: -0.085 },
  { id: 18, name: "Green Valley Expressway",    type: "Expressway", baseLoad: 0.55, lat: 51.488,  lon: -0.095 },
  { id: 19, name: "Northern Heights Boulevard", type: "Boulevard",  baseLoad: 0.60, lat: 51.545,  lon: -0.095 },
  { id: 20, name: "Waterfront Promenade",       type: "City Road",  baseLoad: 0.38, lat: 51.505,  lon: -0.078 },
];

const ROAD_TYPES = ["All Types", ...Array.from(new Set(BASE_ROADS.map(r => r.type))).sort()];
const REFRESH_INTERVAL = 30;
let _nextId = BASE_ROADS.length + 1;

// ── Data generation ───────────────────────────────────────────────────────────
function getTimeFactor() {
  const h = new Date().getHours(), d = new Date().getDay();
  if (d === 0 || d === 6) return 0.5;
  if (h >= 7  && h <= 9)  return 1.0;
  if (h >= 17 && h <= 19) return 0.95;
  if (h >= 10 && h <= 16) return 0.65;
  if (h >= 20 || h <= 6)  return 0.30;
  return 0.60;
}

function jitter(val, amt = 0.12) { return Math.max(0, Math.min(1, val + (Math.random() - 0.5) * amt * 2)); }

function calcStats(rawLoad) {
  const congestion  = Math.round(rawLoad * 100);
  const vehicles    = Math.round(rawLoad * 1800 + Math.random() * 200);
  const speed       = Math.round((1 - rawLoad * 0.85) * 110 + 10);
  const utilisation = Math.min(100, Math.round(rawLoad * 120));
  let status, statusColor, statusBg, barColor;
  if      (congestion >= 75) { status = "Severe";   statusColor = "#dc2626"; statusBg = "#fef2f2"; barColor = "#ef4444"; }
  else if (congestion >= 50) { status = "High";     statusColor = "#ea580c"; statusBg = "#fff7ed"; barColor = "#f97316"; }
  else if (congestion >= 25) { status = "Moderate"; statusColor = "#d97706"; statusBg = "#fffbeb"; barColor = "#f59e0b"; }
  else                       { status = "Clear";    statusColor = "#16a34a"; statusBg = "#f0fdf4"; barColor = "#22c55e"; }
  return { congestion, vehicles, speed, utilisation, status, statusColor, statusBg, barColor };
}

function generateRoadData(prevData, allRoads) {
  const tf = getTimeFactor();
  return allRoads.map(road => {
    const prev = prevData?.find(r => r.id === road.id);
    const target = road.baseLoad * tf;
    const raw = jitter(prev ? (prev.rawLoad * 0.7 + target * 0.3) : target, 0.10);
    const prevCong = prev?.congestion ?? Math.round(raw * 100);
    const stats = calcStats(raw);
    const trend = stats.congestion > prevCong + 3 ? "up" : stats.congestion < prevCong - 3 ? "down" : "flat";
    return { ...road, rawLoad: raw, trend, ...stats };
  });
}

function generateAlerts(roads, prev) {
  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const newAlerts = [];
  roads.forEach(r => {
    if (r.status === "Severe")
      newAlerts.push({ id: Date.now() + r.id, time: timeStr, road: r.name, msg: `Severe congestion — ${r.congestion}% · ${r.speed} km/h`, level: "severe" });
    else if (r.trend === "up" && r.congestion >= 50)
      newAlerts.push({ id: Date.now() + r.id + 100, time: timeStr, road: r.name, msg: `Traffic rising — ${r.congestion}% capacity`, level: "warning" });
  });
  return [...newAlerts, ...(prev || [])].slice(0, 30);
}

// ── Marker color by status ────────────────────────────────────────────────────
const STATUS_COLOR = { Clear: "#22c55e", Moderate: "#f59e0b", High: "#f97316", Severe: "#ef4444" };

function makeCircleIcon(color, size = 14) {
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 4],
  });
}

// ── Leaflet map component ─────────────────────────────────────────────────────
function NetworkMap({ roads, highlightId }) {
  const mapRef  = useRef(null);
  const mapInst = useRef(null);
  const markersRef = useRef({});

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    mapInst.current = L.map(mapRef.current, { zoomControl: false, attributionControl: true });
    L.control.zoom({ position: "bottomright" }).addTo(mapInst.current);
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>', maxZoom: 20 }
    ).addTo(mapInst.current);
    mapInst.current.setView([51.512, -0.090], 12);
    return () => { if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } };
  }, []);

  // Update/add markers whenever roads change
  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    const seen = new Set();
    roads.forEach(road => {
      seen.add(road.id);
      const color = STATUS_COLOR[road.status] || "#9ca3af";
      const isHL  = road.id === highlightId;
      const icon  = makeCircleIcon(color, isHL ? 20 : 14);
      const popup = `
        <div style="font-size:13px;min-width:180px">
          <div style="font-weight:800;color:#0f172a;margin-bottom:4px">${road.name}</div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:8px">${road.type}</div>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <div><div style="font-size:16px;font-weight:800;color:${STATUS_COLOR[road.status]}">${road.congestion}%</div><div style="font-size:10px;color:#9ca3af">Congestion</div></div>
            <div><div style="font-size:16px;font-weight:800;color:#0891b2">${road.vehicles.toLocaleString()}</div><div style="font-size:10px;color:#9ca3af">Veh/hr</div></div>
            <div><div style="font-size:16px;font-weight:800;color:#7c3aed">${road.speed} km/h</div><div style="font-size:10px;color:#9ca3af">Avg Speed</div></div>
          </div>
          <div style="margin-top:8px;padding:3px 8px;border-radius:99px;display:inline-block;background:${road.statusBg};color:${road.statusColor};font-size:10px;font-weight:800">${road.status}</div>
        </div>`;
      if (markersRef.current[road.id]) {
        markersRef.current[road.id].setIcon(icon);
        markersRef.current[road.id].setPopupContent(popup);
      } else {
        const m = L.marker([road.lat, road.lon], { icon })
          .addTo(map)
          .bindPopup(popup, { maxWidth: 240 });
        markersRef.current[road.id] = m;
      }
    });
    // Remove stale markers
    Object.keys(markersRef.current).forEach(id => {
      if (!seen.has(Number(id))) { map.removeLayer(markersRef.current[id]); delete markersRef.current[id]; }
    });
    // Pan to highlight
    if (highlightId && markersRef.current[highlightId]) {
      const m = markersRef.current[highlightId];
      map.setView(m.getLatLng(), 15, { animate: true });
      m.openPopup();
    }
  }, [roads, highlightId]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={mapRef} style={{ height: 340, width: "100%", borderRadius: "0 0 12px 12px" }} />
      {/* Legend */}
      <div style={{ position: "absolute", bottom: 28, left: 12, zIndex: 1000, background: "white", borderRadius: 8, padding: "8px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", display: "flex", gap: 10, fontSize: 11, fontWeight: 700 }}>
        {Object.entries(STATUS_COLOR).map(([s, c]) => (
          <span key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block", border: "1.5px solid white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function TrendIcon({ trend }) {
  if (trend === "up")   return <span style={{ color: "#ef4444", fontWeight: 700 }}>↑</span>;
  if (trend === "down") return <span style={{ color: "#22c55e", fontWeight: 700 }}>↓</span>;
  return <span style={{ color: "#9ca3af" }}>→</span>;
}

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

function exportCSV(roads) {
  const header = ["Road", "Type", "Congestion %", "Vehicles/hr", "Avg Speed km/h", "Utilisation %", "Status", "Trend"];
  const rows = roads.map(r => [r.name, r.type, r.congestion, r.vehicles, r.speed, r.utilisation, r.status, r.trend]);
  const csv = [header, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `traffic_monitoring_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RealTimeMonitoring() {
  const [allRoads, setAllRoads]     = useState(BASE_ROADS);
  const [roads, setRoads]           = useState(() => generateRoadData(null, BASE_ROADS));
  const [alerts, setAlerts]         = useState([]);
  const [countdown, setCountdown]   = useState(REFRESH_INTERVAL);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshCount, setRefreshCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter]     = useState("All Types");
  const [tableSearch, setTableSearch]   = useState("");
  const [sortBy, setSortBy]         = useState("congestion");
  const [sortDir, setSortDir]       = useState("desc");
  const [mapSearch, setMapSearch]   = useState("");
  const [mapSearchResults, setMapSearchResults] = useState([]);
  const [highlightId, setHighlightId] = useState(null);
  const [addName, setAddName]       = useState("");
  const [addType, setAddType]       = useState("City Road");
  const [adding, setAdding]         = useState(false);
  const [addedFlash, setAddedFlash] = useState(null);
  const [showMap, setShowMap]       = useState(true);
  const roadsRef = useRef(allRoads);

  const refresh = useCallback((currentAllRoads) => {
    const list = currentAllRoads || roadsRef.current;
    const newRoads = generateRoadData(roadsRef.current.map ? null : [], list);
    roadsRef.current = newRoads;
    setRoads(newRoads);
    setAlerts(prev => generateAlerts(newRoads, prev));
    setLastUpdated(new Date());
    setCountdown(REFRESH_INTERVAL);
    setRefreshCount(c => c + 1);
  }, []);

  useEffect(() => {
    const initial = generateRoadData(null, BASE_ROADS);
    roadsRef.current = initial;
    setRoads(initial);
    setAlerts(generateAlerts(initial, []));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          const newRoads = generateRoadData(roadsRef.current, allRoads);
          roadsRef.current = newRoads;
          setRoads(newRoads);
          setAlerts(prev => generateAlerts(newRoads, prev));
          setLastUpdated(new Date());
          setRefreshCount(n => n + 1);
          return REFRESH_INTERVAL;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [allRoads]);

  // Map search: filter existing monitored roads by name
  useEffect(() => {
    if (!mapSearch.trim()) { setMapSearchResults([]); return; }
    const q = mapSearch.toLowerCase();
    setMapSearchResults(roads.filter(r => r.name.toLowerCase().includes(q)));
  }, [mapSearch, roads]);

  // Add a new custom road to monitoring
  const handleAddRoad = () => {
    const name = addName.trim();
    if (!name) return;
    if (allRoads.find(r => r.name.toLowerCase() === name.toLowerCase())) {
      alert(`"${name}" is already being monitored.`);
      return;
    }
    setAdding(true);
    setTimeout(() => {
      const id = _nextId++;
      // Scatter custom roads around city center
      const spread = 0.03;
      const lat = 51.512 + (Math.random() - 0.5) * spread;
      const lon = -0.090 + (Math.random() - 0.5) * spread;
      const newDef = { id, name, type: addType, baseLoad: 0.5, lat, lon };
      const tf = getTimeFactor();
      const raw = jitter(0.5 * tf, 0.10);
      const stats = calcStats(raw);
      const newRoad = { ...newDef, rawLoad: raw, trend: "flat", addedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), ...stats };
      setAllRoads(prev => [...prev, newDef]);
      setRoads(prev => [newRoad, ...prev]);
      roadsRef.current = [newRoad, ...roadsRef.current];
      setAddedFlash(id);
      setHighlightId(id);
      setTimeout(() => setAddedFlash(null), 2500);
      setAddName("");
      setAdding(false);
    }, 500);
  };

  // Search result click → highlight on map + scroll
  const handleResultClick = (road) => {
    setHighlightId(road.id);
    setMapSearch(road.name);
    setMapSearchResults([]);
    setShowMap(true);
  };

  // Remove road from monitoring
  const handleRemove = (id) => {
    setAllRoads(prev => prev.filter(r => r.id !== id));
    setRoads(prev => prev.filter(r => r.id !== id));
    roadsRef.current = roadsRef.current.filter(r => r.id !== id);
    if (highlightId === id) setHighlightId(null);
  };

  const manualRefresh = () => {
    const newRoads = generateRoadData(roadsRef.current, allRoads);
    roadsRef.current = newRoads;
    setRoads(newRoads);
    setAlerts(prev => generateAlerts(newRoads, prev));
    setLastUpdated(new Date());
    setCountdown(REFRESH_INTERVAL);
    setRefreshCount(c => c + 1);
  };

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  // Stats
  const severe    = roads.filter(r => r.status === "Severe").length;
  const high      = roads.filter(r => r.status === "High").length;
  const avgCong   = roads.length ? Math.round(roads.reduce((s, r) => s + r.congestion, 0) / roads.length) : 0;
  const avgSpeed  = roads.length ? Math.round(roads.reduce((s, r) => s + r.speed, 0) / roads.length) : 0;
  const totalVeh  = roads.reduce((s, r) => s + r.vehicles, 0);
  const clearCount = roads.filter(r => r.status === "Clear").length;

  const progressColor = countdown < 8 ? "#ef4444" : countdown < 15 ? "#f59e0b" : "#22c55e";

  const COLS = [
    { key: "name",        label: "Road" },
    { key: "type",        label: "Type" },
    { key: "congestion",  label: "Congestion" },
    { key: "vehicles",    label: "Vehicles/hr" },
    { key: "speed",       label: "Avg Speed" },
    { key: "utilisation", label: "Utilisation" },
    { key: "status",      label: "Status" },
    { key: "trend",       label: "Trend" },
  ];

  const filtered = roads
    .filter(r => statusFilter === "All"      || r.status === statusFilter)
    .filter(r => typeFilter   === "All Types" || r.type   === typeFilter)
    .filter(r => r.name.toLowerCase().includes(tableSearch.toLowerCase()))
    .sort((a, b) => {
      let va = a[sortBy], vb = b[sortBy];
      if (typeof va === "string") { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const now = new Date();
  const h   = now.getHours();
  const isWeekend = [0, 6].includes(now.getDay());
  const period = isWeekend ? "Weekend" : h >= 7 && h <= 9 ? "Morning Rush" : h >= 17 && h <= 19 ? "Evening Rush" : h >= 20 || h <= 6 ? "Night" : "Daytime";

  return (
    <>
      <Navbar />
      <div style={{ padding: "24px 32px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, color: "#0f172a" }}>Real-Time Traffic Monitoring</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
              <strong>{roads.length} roads</strong> monitored · Auto-refresh every {REFRESH_INTERVAL}s · {period}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>Last updated</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
            </div>
            <button onClick={() => exportCSV(roads)} style={{ padding: "8px 14px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              ⬇ CSV
            </button>
            <button onClick={manualRefresh} style={{ padding: "8px 18px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ↻ Refresh Now
            </button>
          </div>
        </div>

        {/* ── Countdown bar ── */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>
            Next refresh in <strong style={{ color: progressColor }}>{countdown}s</strong>
          </span>
          <div style={{ flex: 1, background: "#e5e7eb", borderRadius: 99, height: 6, overflow: "hidden" }}>
            <div style={{ width: `${(countdown / REFRESH_INTERVAL) * 100}%`, height: "100%", background: progressColor, borderRadius: 99, transition: "width 1s linear, background 0.3s" }} />
          </div>
          <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>#{refreshCount + 1}</span>
        </div>

        {/* ── KPI Cards ── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { icon: "🛣️", label: "Roads Monitored", value: roads.length,              color: "#1e3a5f", sub: `${allRoads.length > BASE_ROADS.length ? allRoads.length - BASE_ROADS.length + " custom" : BASE_ROADS.length + " base"}` },
            { icon: "📊", label: "Avg Congestion",   value: `${avgCong}%`,             color: avgCong >= 60 ? "#dc2626" : avgCong >= 35 ? "#d97706" : "#16a34a", sub: "all roads" },
            { icon: "🚗", label: "Vehicles/hr",      value: totalVeh.toLocaleString(), color: "#0891b2", sub: "combined" },
            { icon: "⚡", label: "Avg Speed",        value: `${avgSpeed} km/h`,        color: "#7c3aed", sub: "network" },
            { icon: "🔴", label: "Severe / High",    value: `${severe} / ${high}`,     color: severe > 0 ? "#dc2626" : "#d97706", sub: "critical" },
            { icon: "🟢", label: "Clear Roads",      value: clearCount,                color: "#16a34a", sub: `${roads.length - clearCount} delayed` },
            { icon: "⚠️", label: "Alerts",           value: alerts.length,             color: alerts.length > 3 ? "#dc2626" : "#d97706", sub: "session" },
          ].map(({ icon, label, value, color, sub }) => (
            <div key={label} style={{ flex: 1, minWidth: 100, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "12px 16px" }}>
              <div style={{ fontSize: 16, marginBottom: 3 }}>{icon}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginTop: 1 }}>{label}</div>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* ── Search & Add Road ── */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 24px", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
            🔍 Search Road to Monitor
            <span style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af", marginLeft: 8 }}>
              Search existing roads to highlight on map, or add any road by name
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
            {/* Map search — highlights existing road */}
            <div style={{ flex: 2, minWidth: 220, position: "relative" }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                🗺️ Find on Map
              </label>
              <input
                type="text"
                placeholder="Type road name to locate on map…"
                value={mapSearch}
                onChange={e => { setMapSearch(e.target.value); setHighlightId(null); }}
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
              />
              {/* Dropdown results */}
              {mapSearchResults.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 8px 20px rgba(0,0,0,0.12)", zIndex: 500, overflow: "hidden", marginTop: 4 }}>
                  {mapSearchResults.slice(0, 6).map(r => (
                    <div key={r.id} onClick={() => handleResultClick(r)} style={{
                      padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "white"}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{r.type} · {r.congestion}% congestion</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: r.statusBg, color: r.statusColor }}>{r.status}</span>
                    </div>
                  ))}
                  {mapSearchResults.length === 0 && (
                    <div style={{ padding: "12px 14px", color: "#9ca3af", fontSize: 13 }}>No roads found.</div>
                  )}
                </div>
              )}
            </div>

            <div style={{ width: 1, background: "#e5e7eb", alignSelf: "stretch", margin: "0 4px", flexShrink: 0 }} />

            {/* Add new road */}
            <div style={{ flex: 2, minWidth: 200 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                ➕ Add New Road to Monitor
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="e.g. Harbour Bridge Approach"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddRoad()}
                  style={{ flex: 1, padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, boxSizing: "border-box" }}
                />
                <select
                  value={addType}
                  onChange={e => setAddType(e.target.value)}
                  style={{ padding: "10px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 12, background: "white" }}
                >
                  {["City Road","Highway","Expressway","Ring Road","Bridge","Tunnel","Suburban","Boulevard"].map(t => <option key={t}>{t}</option>)}
                </select>
                <button
                  onClick={handleAddRoad}
                  disabled={adding || !addName.trim()}
                  style={{ padding: "10px 18px", background: adding || !addName.trim() ? "#93c5fd" : "#2563eb", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: adding || !addName.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
                >
                  {adding ? "⏳…" : "Monitor"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Map + Type breakdown row ── */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>

          {/* Map */}
          <div style={{ flex: 3, minWidth: 300, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                🗺️ Network Map — {roads.length} Roads
                {highlightId && <span style={{ fontSize: 11, fontWeight: 400, color: "#2563eb", marginLeft: 8 }}>📍 {roads.find(r => r.id === highlightId)?.name}</span>}
              </span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {highlightId && (
                  <button onClick={() => { setHighlightId(null); setMapSearch(""); }} style={{ fontSize: 11, color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}>✕ Clear highlight</button>
                )}
                <button onClick={() => setShowMap(v => !v)} style={{ fontSize: 12, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                  {showMap ? "Hide ▲" : "Show ▼"}
                </button>
              </div>
            </div>
            {showMap && <NetworkMap roads={roads} highlightId={highlightId} />}
          </div>

          {/* Type breakdown */}
          <div style={{ flex: 1, minWidth: 200, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14, marginBottom: 12 }}>📋 By Road Type</div>
            {ROAD_TYPES.slice(1).map(type => {
              const group = roads.filter(r => r.type === type);
              if (!group.length) return null;
              const avgC = Math.round(group.reduce((s, r) => s + r.congestion, 0) / group.length);
              const s = TYPE_COLORS[type] || { bg: "#f3f4f6", color: "#6b7280" };
              return (
                <div key={type} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: s.color, fontWeight: 700 }}>{type} ({group.length})</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: avgC >= 60 ? "#dc2626" : avgC >= 35 ? "#d97706" : "#16a34a" }}>{avgC}%</span>
                  </div>
                  <div style={{ height: 5, background: "#f3f4f6", borderRadius: 99 }}>
                    <div style={{ width: `${avgC}%`, height: "100%", background: avgC >= 60 ? "#ef4444" : avgC >= 35 ? "#f59e0b" : "#22c55e", borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
            {/* Status count strip */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f3f4f6" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Status Summary</div>
              {["Clear","Moderate","High","Severe"].map(s => {
                const cnt   = roads.filter(r => r.status === s).length;
                const pct   = Math.round((cnt / Math.max(roads.length, 1)) * 100);
                const color = { Clear: "#22c55e", Moderate: "#f59e0b", High: "#f97316", Severe: "#ef4444" }[s];
                return (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color, fontWeight: 700, minWidth: 60 }}>{s}</span>
                    <div style={{ flex: 1, height: 4, background: "#f3f4f6", borderRadius: 99 }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, color: "#6b7280", minWidth: 24 }}>{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Main layout: table + alert log ── */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>

          {/* Table */}
          <div style={{ flex: 3, minWidth: 300 }}>
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
              {/* Table controls */}
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                    🚦 All {roads.length} Roads — Full Sensor Data
                    {filtered.length < roads.length && <span style={{ fontSize: 11, fontWeight: 400, color: "#9ca3af", marginLeft: 8 }}>({filtered.length} shown)</span>}
                  </div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>🔍</span>
                    <input type="text" placeholder="Filter table…" value={tableSearch} onChange={e => setTableSearch(e.target.value)}
                      style={{ padding: "6px 12px 6px 30px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 12, width: 160 }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, marginRight: 2 }}>STATUS:</span>
                  {["All","Clear","Moderate","High","Severe"].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)} style={{
                      padding: "3px 9px", borderRadius: 99, border: "1px solid", fontSize: 11, fontWeight: 600, cursor: "pointer",
                      borderColor: statusFilter === s ? "#2563eb" : "#e5e7eb",
                      background: statusFilter === s ? "#2563eb" : "white",
                      color: statusFilter === s ? "white" : "#6b7280",
                    }}>{s}</button>
                  ))}
                  <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, marginLeft: 6, marginRight: 2 }}>TYPE:</span>
                  {ROAD_TYPES.map(t => (
                    <button key={t} onClick={() => setTypeFilter(t)} style={{
                      padding: "3px 9px", borderRadius: 99, border: "1px solid", fontSize: 11, fontWeight: 600, cursor: "pointer",
                      borderColor: typeFilter === t ? "#7c3aed" : "#e5e7eb",
                      background: typeFilter === t ? "#7c3aed" : "white",
                      color: typeFilter === t ? "white" : "#6b7280",
                    }}>{t}</button>
                  ))}
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {COLS.map(col => (
                        <th key={col.key} onClick={() => toggleSort(col.key)} style={{
                          padding: "9px 12px", textAlign: "left", color: "#6b7280", fontWeight: 600, fontSize: 10,
                          textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #e5e7eb",
                          whiteSpace: "nowrap", cursor: "pointer", userSelect: "none",
                        }}>
                          {col.label} {sortBy === col.key && (sortDir === "asc" ? "↑" : "↓")}
                        </th>
                      ))}
                      <th style={{ padding: "9px 12px", color: "#6b7280", fontWeight: 600, fontSize: 10, textTransform: "uppercase", borderBottom: "1px solid #e5e7eb", textAlign: "center" }}>Act.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={9} style={{ padding: 28, textAlign: "center", color: "#9ca3af" }}>No roads match filters.</td></tr>
                    )}
                    {filtered.map((road, i) => {
                      const isHL    = road.id === highlightId;
                      const isFlash = road.id === addedFlash;
                      return (
                        <tr key={road.id}
                          onClick={() => { setHighlightId(road.id); setShowMap(true); }}
                          style={{
                            borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none",
                            background: isFlash ? "#eff6ff" : isHL ? "#f0fdf4" : "white",
                            transition: "background 0.4s", cursor: "pointer",
                          }}
                          onMouseEnter={e => { if (!isHL && !isFlash) e.currentTarget.style.background = "#f8fafc"; }}
                          onMouseLeave={e => { if (!isHL && !isFlash) e.currentTarget.style.background = "white"; }}
                        >
                          <td style={{ padding: "10px 12px", fontWeight: 700, color: "#111", whiteSpace: "nowrap" }}>
                            {isHL && <span style={{ color: "#2563eb", marginRight: 4 }}>📍</span>}
                            {road.name}
                            {isFlash && <span style={{ marginLeft: 6, fontSize: 10, color: "#2563eb", fontWeight: 700 }}>NEW</span>}
                          </td>
                          <td style={{ padding: "10px 12px" }}><TypeBadge type={road.type} /></td>
                          <td style={{ padding: "10px 12px", minWidth: 120 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ flex: 1, background: "#e5e7eb", borderRadius: 99, height: 6, overflow: "hidden" }}>
                                <div style={{ width: `${road.congestion}%`, height: "100%", background: road.barColor, borderRadius: 99, transition: "width 0.6s" }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 800, color: road.statusColor, minWidth: 30 }}>{road.congestion}%</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 12px", color: "#374151", fontWeight: 500 }}>{road.vehicles.toLocaleString()}</td>
                          <td style={{ padding: "10px 12px", color: "#374151" }}>{road.speed} km/h</td>
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <div style={{ width: 36, height: 4, background: "#f3f4f6", borderRadius: 99 }}>
                                <div style={{ width: `${road.utilisation}%`, height: "100%", background: road.utilisation > 80 ? "#ef4444" : road.utilisation > 60 ? "#f59e0b" : "#22c55e", borderRadius: 99 }} />
                              </div>
                              <span style={{ fontSize: 10 }}>{road.utilisation}%</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ padding: "2px 9px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: road.statusBg, color: road.statusColor }}>{road.status}</span>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}><TrendIcon trend={road.trend} /></td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                            <button onClick={e => { e.stopPropagation(); handleRemove(road.id); }} title="Remove" style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 13, padding: 0 }}>✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ padding: "8px 14px", background: "#f8fafc", borderTop: "1px solid #f3f4f6", fontSize: 10, color: "#9ca3af", display: "flex", justifyContent: "space-between" }}>
                <span>Showing {filtered.length} of {roads.length} roads · Click a row to locate on map</span>
                <span>Sortable · All fields live-updated every {REFRESH_INTERVAL}s</span>
              </div>
            </div>
          </div>

          {/* Alert log */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontWeight: 700, color: "#0f172a", fontSize: 13 }}>
                ⚠️ Alert Log <span style={{ fontSize: 11, fontWeight: 400, color: "#9ca3af" }}>({alerts.length})</span>
              </div>
              <div style={{ maxHeight: 480, overflowY: "auto", padding: "4px 0" }}>
                {alerts.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>✅ No alerts</div>}
                {alerts.map(alert => (
                  <div key={alert.id} style={{ padding: "9px 14px", borderBottom: "1px solid #f3f4f6" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: alert.level === "severe" ? "#fef2f2" : "#fffbeb", color: alert.level === "severe" ? "#dc2626" : "#d97706" }}>
                        {alert.level === "severe" ? "SEVERE" : "WARN"}
                      </span>
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>{alert.time}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 1 }}>{alert.road}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{alert.msg}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ marginTop: 14, display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>Congestion:</span>
          {[["🟢 Clear","< 25%"], ["🟡 Moderate","25–49%"], ["🟠 High","50–74%"], ["🔴 Severe","≥ 75%"]].map(([l, r]) => (
            <span key={l} style={{ fontSize: 11, color: "#6b7280" }}><strong>{l}</strong> {r}</span>
          ))}
          <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: "auto" }}>↑ rising · ↓ falling · → stable</span>
        </div>
      </div>
    </>
  );
}
