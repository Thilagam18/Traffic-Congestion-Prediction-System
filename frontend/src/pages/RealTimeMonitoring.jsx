import React, { useState, useEffect, useRef, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Navbar from "../components/Navbar";

// ── World roads across major cities ───────────────────────────────────────────
const WORLD_ROADS = [
  { id:  1, name: "5th Avenue / Midtown",       city: "New York",    country: "USA",          type: "City Road",  baseLoad: 0.82, lat: 40.7549,  lon: -73.9840 },
  { id:  2, name: "Brooklyn Bridge Approach",    city: "New York",    country: "USA",          type: "Bridge",     baseLoad: 0.70, lat: 40.7061,  lon: -73.9969 },
  { id:  3, name: "Champs-Élysées",              city: "Paris",       country: "France",       type: "Boulevard",  baseLoad: 0.75, lat: 48.8698,  lon:   2.3078 },
  { id:  4, name: "Périphérique Inner Ring",     city: "Paris",       country: "France",       type: "Ring Road",  baseLoad: 0.85, lat: 48.8584,  lon:   2.3395 },
  { id:  5, name: "Shibuya Crossing",            city: "Tokyo",       country: "Japan",        type: "City Road",  baseLoad: 0.90, lat: 35.6598,  lon: 139.7006 },
  { id:  6, name: "Tokyo Expressway C2",         city: "Tokyo",       country: "Japan",        type: "Expressway", baseLoad: 0.72, lat: 35.6762,  lon: 139.6503 },
  { id:  7, name: "Sheikh Zayed Road",           city: "Dubai",       country: "UAE",          type: "Highway",    baseLoad: 0.65, lat: 25.2048,  lon:  55.2708 },
  { id:  8, name: "Western Express Highway",     city: "Mumbai",      country: "India",        type: "Highway",    baseLoad: 0.88, lat: 19.0760,  lon:  72.8777 },
  { id:  9, name: "Harbour Bridge Approach",     city: "Sydney",      country: "Australia",    type: "Bridge",     baseLoad: 0.68, lat: -33.8523, lon: 151.2108 },
  { id: 10, name: "M25 Orbital Motorway",        city: "London",      country: "UK",           type: "Motorway",   baseLoad: 0.78, lat: 51.4747,  lon:  -0.4680 },
  { id: 11, name: "Autobahn A100",               city: "Berlin",      country: "Germany",      type: "Motorway",   baseLoad: 0.62, lat: 52.5200,  lon:  13.4050 },
  { id: 12, name: "I-405 San Diego Freeway",     city: "Los Angeles", country: "USA",          type: "Highway",    baseLoad: 0.86, lat: 34.0522,  lon: -118.2437 },
  { id: 13, name: "Marginal Pinheiros",          city: "São Paulo",   country: "Brazil",       type: "Expressway", baseLoad: 0.80, lat: -23.5505, lon:  -46.6333 },
  { id: 14, name: "Gangnam-daero Boulevard",     city: "Seoul",       country: "South Korea",  type: "Boulevard",  baseLoad: 0.76, lat: 37.4979,  lon: 127.0276 },
  { id: 15, name: "Garden Ring Road",            city: "Moscow",      country: "Russia",       type: "Ring Road",  baseLoad: 0.74, lat: 55.7558,  lon:  37.6173 },
  { id: 16, name: "Sukhumvit Road",              city: "Bangkok",     country: "Thailand",     type: "City Road",  baseLoad: 0.83, lat: 13.7563,  lon: 100.5018 },
  { id: 17, name: "Cairo Ring Road (Segment)",   city: "Cairo",       country: "Egypt",        type: "Ring Road",  baseLoad: 0.71, lat: 30.0444,  lon:  31.2357 },
  { id: 18, name: "East Coast Parkway",          city: "Singapore",   country: "Singapore",    type: "Expressway", baseLoad: 0.58, lat:  1.3521,  lon: 103.8198 },
  { id: 19, name: "O-1 Motorway (TEM)",          city: "Istanbul",    country: "Turkey",       type: "Motorway",   baseLoad: 0.79, lat: 41.0082,  lon:  28.9784 },
  { id: 20, name: "Gardiner Expressway",         city: "Toronto",     country: "Canada",       type: "Expressway", baseLoad: 0.67, lat: 43.6532,  lon:  -79.3832 },
  { id: 21, name: "Periférico Ring Road",        city: "Mexico City", country: "Mexico",       type: "Ring Road",  baseLoad: 0.84, lat: 19.4326,  lon:  -99.1332 },
  { id: 22, name: "Second Ring Road",            city: "Beijing",     country: "China",        type: "Ring Road",  baseLoad: 0.87, lat: 39.9042,  lon: 116.4074 },
];

const REFRESH_INTERVAL = 30;

// ── WMO weather codes ─────────────────────────────────────────────────────────
const WMO = {
  0: { desc: "Clear sky",       emoji: "☀️",  impact: 0 },
  1: { desc: "Mainly clear",    emoji: "🌤️", impact: 0 },
  2: { desc: "Partly cloudy",   emoji: "⛅",  impact: 0 },
  3: { desc: "Overcast",        emoji: "☁️",  impact: 0 },
  45: { desc: "Foggy",          emoji: "🌫️", impact: 2 },
  48: { desc: "Icy fog",        emoji: "🌫️", impact: 2 },
  51: { desc: "Light drizzle",  emoji: "🌦️", impact: 1 },
  53: { desc: "Drizzle",        emoji: "🌦️", impact: 1 },
  55: { desc: "Dense drizzle",  emoji: "🌦️", impact: 1 },
  61: { desc: "Light rain",     emoji: "🌧️", impact: 1 },
  63: { desc: "Moderate rain",  emoji: "🌧️", impact: 1 },
  65: { desc: "Heavy rain",     emoji: "🌧️", impact: 2 },
  71: { desc: "Light snow",     emoji: "🌨️", impact: 1 },
  73: { desc: "Moderate snow",  emoji: "🌨️", impact: 2 },
  75: { desc: "Heavy snow",     emoji: "❄️",  impact: 2 },
  80: { desc: "Rain showers",   emoji: "🌧️", impact: 1 },
  81: { desc: "Showers",        emoji: "🌧️", impact: 1 },
  82: { desc: "Heavy showers",  emoji: "⛈️",  impact: 2 },
  95: { desc: "Thunderstorm",   emoji: "⛈️",  impact: 2 },
  96: { desc: "Storm + hail",   emoji: "⛈️",  impact: 2 },
  99: { desc: "Heavy storm",    emoji: "⛈️",  impact: 2 },
};
function wmo(code) { return WMO[code] || { desc: "Unknown", emoji: "🌡️", impact: 0 }; }

// ── Traffic generation ────────────────────────────────────────────────────────
function getTimeFactor() {
  const h = new Date().getHours(), d = new Date().getDay();
  if (d === 0 || d === 6) return 0.50;
  if (h >= 7  && h <= 9)  return 1.0;
  if (h >= 17 && h <= 19) return 0.95;
  if (h >= 10 && h <= 16) return 0.65;
  if (h >= 20 || h <= 6)  return 0.30;
  return 0.60;
}

function jitter(val, amt = 0.10) { return Math.max(0, Math.min(1, val + (Math.random() - 0.5) * amt * 2)); }

function calcStats(rawLoad, weatherImpact = 0) {
  const weatherBoost = weatherImpact === 2 ? 0.15 : weatherImpact === 1 ? 0.08 : 0;
  const load = Math.min(0.99, rawLoad + weatherBoost);
  const congestion  = Math.round(load * 100);
  const vehicles    = Math.round(load * 1800 + Math.random() * 200);
  const speed       = Math.round((1 - load * 0.85) * 110 + 10);
  let status, statusColor, statusBg, barColor;
  if      (congestion >= 75) { status = "Severe";   statusColor = "#dc2626"; statusBg = "#fef2f2"; barColor = "#ef4444"; }
  else if (congestion >= 50) { status = "High";     statusColor = "#ea580c"; statusBg = "#fff7ed"; barColor = "#f97316"; }
  else if (congestion >= 25) { status = "Moderate"; statusColor = "#d97706"; statusBg = "#fffbeb"; barColor = "#f59e0b"; }
  else                       { status = "Clear";    statusColor = "#16a34a"; statusBg = "#f0fdf4"; barColor = "#22c55e"; }
  return { congestion, vehicles, speed, status, statusColor, statusBg, barColor, rawLoad: load };
}

function generateRoadData(prevData, weatherMap) {
  const tf = getTimeFactor();
  return WORLD_ROADS.map(road => {
    const prev = prevData?.find(r => r.id === road.id);
    const target = road.baseLoad * tf;
    const raw = jitter(prev ? (prev.rawLoad * 0.7 + target * 0.3) : target, 0.10);
    const weatherImpact = weatherMap?.[road.id]?.impact ?? 0;
    const stats = calcStats(raw, weatherImpact);
    const prevCong = prev?.congestion ?? stats.congestion;
    const trend = stats.congestion > prevCong + 3 ? "up" : stats.congestion < prevCong - 3 ? "down" : "flat";
    const weather = weatherMap?.[road.id] ?? null;
    return { ...road, trend, weather, ...stats };
  });
}

// ── Fetch weather for all world roads ─────────────────────────────────────────
async function fetchAllWeather(roads) {
  const map = {};
  await Promise.all(roads.map(async road => {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${road.lat}&longitude=${road.lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto`
      );
      const data = await res.json();
      const c = data.current;
      const info = wmo(c.weather_code);
      map[road.id] = {
        temp: Math.round(c.temperature_2m),
        code: c.weather_code,
        wind: Math.round(c.wind_speed_10m),
        humidity: c.relative_humidity_2m,
        emoji: info.emoji,
        desc: info.desc,
        impact: info.impact,
      };
    } catch { /* ignore failed weather */ }
  }));
  return map;
}

// ── Status colours ────────────────────────────────────────────────────────────
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

// ── Leaflet world map ─────────────────────────────────────────────────────────
function WorldMap({ roads, highlightId }) {
  const mapRef   = useRef(null);
  const mapInst  = useRef(null);
  const markersR = useRef({});

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    mapInst.current = L.map(mapRef.current, { zoomControl: false, attributionControl: true });
    L.control.zoom({ position: "bottomright" }).addTo(mapInst.current);
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>', maxZoom: 20 }
    ).addTo(mapInst.current);
    mapInst.current.setView([20, 10], 2);
    return () => { if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } };
  }, []);

  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    const seen = new Set();
    roads.forEach(road => {
      seen.add(road.id);
      const color = STATUS_COLOR[road.status] || "#9ca3af";
      const isHL  = road.id === highlightId;
      const icon  = makeCircleIcon(color, isHL ? 22 : 14);
      const w = road.weather;
      const weatherHtml = w
        ? `<div style="margin-top:8px;padding:6px 8px;background:#f8fafc;border-radius:6px;font-size:11px;color:#374151">
            <span style="font-size:16px">${w.emoji}</span>
            <strong>${w.temp}°C</strong> · ${w.desc}<br/>
            <span style="color:#9ca3af">💨 ${w.wind} km/h · 💧 ${w.humidity}%</span>
          </div>`
        : "";
      const popup = `
        <div style="font-size:13px;min-width:200px">
          <div style="font-weight:800;color:#0f172a;margin-bottom:2px">${road.name}</div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:6px">${road.city}, ${road.country} · ${road.type}</div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:4px">
            <div><div style="font-size:18px;font-weight:800;color:${STATUS_COLOR[road.status]}">${road.congestion}%</div><div style="font-size:10px;color:#9ca3af">Congestion</div></div>
            <div><div style="font-size:18px;font-weight:800;color:#0891b2">${road.vehicles.toLocaleString()}</div><div style="font-size:10px;color:#9ca3af">Veh/hr</div></div>
            <div><div style="font-size:18px;font-weight:800;color:#7c3aed">${road.speed} km/h</div><div style="font-size:10px;color:#9ca3af">Speed</div></div>
          </div>
          <div style="padding:2px 8px;border-radius:99px;display:inline-block;background:${road.statusBg};color:${road.statusColor};font-size:10px;font-weight:800">${road.status}</div>
          ${weatherHtml}
        </div>`;
      if (markersR.current[road.id]) {
        markersR.current[road.id].setIcon(icon);
        markersR.current[road.id].setPopupContent(popup);
      } else {
        markersR.current[road.id] = L.marker([road.lat, road.lon], { icon })
          .addTo(map).bindPopup(popup, { maxWidth: 260 });
      }
    });
    Object.keys(markersR.current).forEach(id => {
      if (!seen.has(Number(id))) { map.removeLayer(markersR.current[id]); delete markersR.current[id]; }
    });
    if (highlightId && markersR.current[highlightId]) {
      const m = markersR.current[highlightId];
      map.setView(m.getLatLng(), 12, { animate: true });
      m.openPopup();
    }
  }, [roads, highlightId]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={mapRef} style={{ height: 420, width: "100%", borderRadius: "0 0 12px 12px" }} />
      <div style={{ position: "absolute", bottom: 28, left: 12, zIndex: 1000, background: "white", borderRadius: 8, padding: "7px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", display: "flex", gap: 10, fontSize: 11, fontWeight: 700 }}>
        {Object.entries(STATUS_COLOR).map(([s, c]) => (
          <span key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block", border: "1.5px solid white" }} />
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function TrendIcon({ trend }) {
  if (trend === "up")   return <span style={{ color: "#ef4444", fontWeight: 700 }}>↑</span>;
  if (trend === "down") return <span style={{ color: "#22c55e", fontWeight: 700 }}>↓</span>;
  return <span style={{ color: "#9ca3af" }}>→</span>;
}

function exportCSV(roads) {
  const header = ["Road", "City", "Country", "Type", "Congestion%", "Vehicles/hr", "Speed km/h", "Status", "Trend", "Temp°C", "Weather"];
  const rows = roads.map(r => [r.name, r.city, r.country, r.type, r.congestion, r.vehicles, r.speed, r.status, r.trend, r.weather?.temp ?? "", r.weather?.desc ?? ""]);
  const csv = [header, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `world_traffic_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RealTimeMonitoring() {
  const [roads, setRoads]             = useState([]);
  const [weatherMap, setWeatherMap]   = useState({});
  const [weatherLoading, setWL]       = useState(true);
  const [countdown, setCountdown]     = useState(REFRESH_INTERVAL);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState("All");
  const [countryFilter, setCountryFilter] = useState("All");
  const [tableSearch, setTableSearch] = useState("");
  const [sortBy, setSortBy]           = useState("congestion");
  const [sortDir, setSortDir]         = useState("desc");
  const [highlightId, setHighlightId] = useState(null);
  const [showMap, setShowMap]         = useState(true);
  const roadsRef = useRef([]);

  // Fetch weather once on mount (and every 10 min)
  const loadWeather = useCallback(async () => {
    setWL(true);
    const map = await fetchAllWeather(WORLD_ROADS);
    setWeatherMap(map);
    setWL(false);
    return map;
  }, []);

  useEffect(() => {
    loadWeather().then(map => {
      const initial = generateRoadData(null, map);
      roadsRef.current = initial;
      setRoads(initial);
      setLastUpdated(new Date());
    });
    const weatherTimer = setInterval(loadWeather, 10 * 60 * 1000);
    return () => clearInterval(weatherTimer);
  }, [loadWeather]);

  // Traffic refresh every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          const newRoads = generateRoadData(roadsRef.current, weatherMap);
          roadsRef.current = newRoads;
          setRoads(newRoads);
          setLastUpdated(new Date());
          return REFRESH_INTERVAL;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [weatherMap]);

  const manualRefresh = () => {
    const newRoads = generateRoadData(roadsRef.current, weatherMap);
    roadsRef.current = newRoads;
    setRoads(newRoads);
    setLastUpdated(new Date());
    setCountdown(REFRESH_INTERVAL);
  };

  const toggleSort = col => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const countries = ["All", ...Array.from(new Set(WORLD_ROADS.map(r => r.country))).sort()];

  const filtered = roads
    .filter(r => statusFilter === "All" || r.status === statusFilter)
    .filter(r => countryFilter === "All" || r.country === countryFilter)
    .filter(r => r.name.toLowerCase().includes(tableSearch.toLowerCase()) || r.city.toLowerCase().includes(tableSearch.toLowerCase()))
    .sort((a, b) => {
      let va = a[sortBy], vb = b[sortBy];
      if (typeof va === "string") { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const avgCong  = roads.length ? Math.round(roads.reduce((s, r) => s + r.congestion, 0) / roads.length) : 0;
  const avgSpeed = roads.length ? Math.round(roads.reduce((s, r) => s + r.speed, 0) / roads.length) : 0;
  const totalVeh = roads.reduce((s, r) => s + r.vehicles, 0);
  const severe   = roads.filter(r => r.status === "Severe").length;
  const high     = roads.filter(r => r.status === "High").length;
  const clear    = roads.filter(r => r.status === "Clear").length;
  const progressColor = countdown < 8 ? "#ef4444" : countdown < 15 ? "#f59e0b" : "#22c55e";

  const COLS = [
    { key: "name",       label: "Road" },
    { key: "city",       label: "City" },
    { key: "type",       label: "Type" },
    { key: "congestion", label: "Traffic" },
    { key: "vehicles",   label: "Veh/hr" },
    { key: "speed",      label: "Speed" },
    { key: "status",     label: "Status" },
    { key: "trend",      label: "Trend" },
  ];

  return (
    <>
      <Navbar />
      <style>{`
        .th-btn { background: none; border: none; cursor: pointer; color: inherit; font-weight: 700; font-size: 11px; padding: 0; display: flex; align-items: center; gap: 3px; white-space: nowrap; }
        .road-row:hover { background: #f8fafc !important; }
      `}</style>
      <div style={{ padding: "24px 32px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, color: "#0f172a" }}>🌍 World Traffic & Weather Monitor</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
              <strong>{roads.length} roads</strong> across {new Set(WORLD_ROADS.map(r => r.country)).size} countries · Live weather from Open-Meteo · Auto-refresh every {REFRESH_INTERVAL}s
              {weatherLoading && <span style={{ marginLeft: 8, color: "#2563eb" }}>⟳ Fetching weather…</span>}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>Last updated</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
            </div>
            <button onClick={() => exportCSV(roads)} style={{ padding: "8px 14px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              ⬇ Export CSV
            </button>
            <button onClick={manualRefresh} style={{ padding: "8px 18px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ↻ Refresh Now
            </button>
          </div>
        </div>

        {/* Countdown bar */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>
            Traffic refresh in <strong style={{ color: progressColor }}>{countdown}s</strong>
          </span>
          <div style={{ flex: 1, background: "#e5e7eb", borderRadius: 99, height: 6, overflow: "hidden" }}>
            <div style={{ width: `${(countdown / REFRESH_INTERVAL) * 100}%`, height: "100%", background: progressColor, borderRadius: 99, transition: "width 1s linear" }} />
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { icon: "🌍", label: "Roads Worldwide",  value: roads.length,              color: "#1e3a5f",                                                 sub: `${new Set(WORLD_ROADS.map(r=>r.country)).size} countries` },
            { icon: "📊", label: "Avg Congestion",    value: `${avgCong}%`,             color: avgCong >= 60 ? "#dc2626" : avgCong >= 35 ? "#d97706" : "#16a34a", sub: "all roads" },
            { icon: "🚗", label: "Total Vehicles/hr", value: totalVeh.toLocaleString(), color: "#0891b2",                                                 sub: "combined" },
            { icon: "⚡", label: "Avg Speed",         value: `${avgSpeed} km/h`,        color: "#7c3aed",                                                 sub: "worldwide avg" },
            { icon: "🔴", label: "Severe / High",     value: `${severe} / ${high}`,     color: severe > 0 ? "#dc2626" : "#d97706",                       sub: "critical roads" },
            { icon: "🟢", label: "Clear Roads",       value: clear,                     color: "#16a34a",                                                 sub: `${roads.length - clear} with delays` },
          ].map(({ icon, label, value, color, sub }) => (
            <div key={label} style={{ flex: 1, minWidth: 120, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 18, marginBottom: 3 }}>{icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginTop: 2 }}>{label}</div>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Weather summary strip */}
        {!weatherLoading && roads.length > 0 && (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 20px", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>🌤️ Live Weather at Monitored Locations</div>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              {roads.filter(r => r.weather).map(road => (
                <div
                  key={road.id}
                  onClick={() => { setHighlightId(road.id); setShowMap(true); }}
                  style={{ flexShrink: 0, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", cursor: "pointer", minWidth: 120, textAlign: "center", transition: "box-shadow 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                >
                  <div style={{ fontSize: 22 }}>{road.weather.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{road.city}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#2563eb" }}>{road.weather.temp}°C</div>
                  <div style={{ fontSize: 10, color: "#6b7280" }}>{road.weather.desc}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>💨 {road.weather.wind} km/h</div>
                  <div style={{
                    marginTop: 6, fontSize: 10, fontWeight: 700,
                    color: STATUS_COLOR[road.status],
                    background: road.statusBg,
                    borderRadius: 99, padding: "1px 6px",
                  }}>{road.congestion}% {road.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* World Map */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, color: "#1e3a5f", fontSize: 14 }}>
              🗺️ World Traffic Map
              <span style={{ fontSize: 11, fontWeight: 400, color: "#9ca3af", marginLeft: 8 }}>Click any marker for traffic + weather details</span>
            </span>
            <button onClick={() => setShowMap(v => !v)} style={{ background: "#f3f4f6", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#374151", fontWeight: 600 }}>
              {showMap ? "▲ Hide" : "▼ Show"}
            </button>
          </div>
          {showMap && <WorldMap roads={roads} highlightId={highlightId} />}
        </div>

        {/* Filters */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="🔍 Search road or city…"
            value={tableSearch}
            onChange={e => setTableSearch(e.target.value)}
            style={{ flex: 2, minWidth: 180, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }}
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
            {["All", "Clear", "Moderate", "High", "Severe"].map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
            {countries.map(c => <option key={c}>{c}</option>)}
          </select>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{filtered.length} results</span>
        </div>

        {/* Table */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                  {COLS.map(col => (
                    <th key={col.key} style={{ padding: "10px 14px", textAlign: "left" }}>
                      <button className="th-btn" onClick={() => toggleSort(col.key)}>
                        {col.label} {sortBy === col.key ? (sortDir === "asc" ? "↑" : "↓") : <span style={{ color: "#d1d5db" }}>⇅</span>}
                      </button>
                    </th>
                  ))}
                  <th style={{ padding: "10px 14px", textAlign: "left" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Weather</span>
                  </th>
                  <th style={{ padding: "10px 14px" }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((road, i) => (
                  <tr key={road.id} className="road-row" style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "11px 14px", fontWeight: 600, color: "#0f172a" }}>
                      <div>{road.name}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{road.country}</div>
                    </td>
                    <td style={{ padding: "11px 14px", color: "#374151" }}>
                      <div style={{ fontWeight: 600 }}>{road.city}</div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "#f3f4f6", color: "#6b7280", whiteSpace: "nowrap" }}>{road.type}</span>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: "#f3f4f6", borderRadius: 99, minWidth: 60, overflow: "hidden" }}>
                          <div style={{ width: `${road.congestion}%`, height: "100%", background: road.barColor, borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: road.statusColor, minWidth: 36 }}>{road.congestion}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px", color: "#374151", fontWeight: 500 }}>{road.vehicles.toLocaleString()}</td>
                    <td style={{ padding: "11px 14px", color: "#7c3aed", fontWeight: 600 }}>{road.speed} km/h</td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: road.statusBg, color: road.statusColor }}>{road.status}</span>
                    </td>
                    <td style={{ padding: "11px 14px" }}><TrendIcon trend={road.trend} /></td>
                    <td style={{ padding: "11px 14px" }}>
                      {road.weather ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#374151" }}>
                          <span style={{ fontSize: 16 }}>{road.weather.emoji}</span>
                          <div>
                            <div style={{ fontWeight: 700 }}>{road.weather.temp}°C</div>
                            <div style={{ fontSize: 10, color: "#9ca3af" }}>{road.weather.desc}</div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: "#d1d5db", fontSize: 11 }}>Loading…</span>
                      )}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <button
                        onClick={() => { setHighlightId(road.id); setShowMap(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}
                      >
                        📍 View on Map
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ padding: "32px", textAlign: "center", color: "#9ca3af" }}>No roads match the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}
