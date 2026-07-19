import React, { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

// ── Weather icon map (WMO codes) ──────────────────────────────────────────────
const WMO_ICONS = {
  0:"☀️",1:"🌤️",2:"⛅",3:"☁️",45:"🌫️",48:"🌫️",
  51:"🌦️",53:"🌦️",55:"🌦️",61:"🌧️",63:"🌧️",65:"⛈️",
  71:"🌨️",73:"🌨️",75:"❄️",80:"🌧️",81:"🌧️",82:"⛈️",95:"⛈️",99:"⛈️",
};

// ── Road data ─────────────────────────────────────────────────────────────────
const ALL_ROADS = [
  "Downtown Main Street", "North Ring Road", "East Highway I-42",
  "West Bridge Corridor", "Central Avenue", "South Bypass Expressway",
  "Industrial Park Road", "Airport Link Highway", "Riverside Drive",
  "Market District Road", "Commerce Boulevard", "University Avenue",
  "Harbor Tunnel Approach", "Suburban Link Road", "Tech Park Connector",
  "Old Town Quarter Street", "Sports Complex Drive", "Green Valley Expressway",
  "Northern Heights Boulevard", "Waterfront Promenade",
];

function getTimeFactor() {
  const h = new Date().getHours(), d = new Date().getDay();
  if (d === 0 || d === 6) return 0.45;
  if (h >= 7  && h <= 9)  return 1.0;
  if (h >= 17 && h <= 19) return 0.95;
  if (h >= 10 && h <= 16) return 0.65;
  if (h >= 20 || h <= 6)  return 0.25;
  return 0.6;
}

function genRoad(name) {
  const tf = getTimeFactor();
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = 0.3 + (hash % 50) / 100;
  const load = Math.min(0.98, base * tf + Math.random() * 0.12);
  const congestion = Math.round(load * 100);
  const vehicles = Math.round(load * 1800 + Math.random() * 150);
  const speed = Math.round((1 - load * 0.85) * 110 + 10);
  let status, sColor, sBg, barColor;
  if      (congestion >= 75) { status = "Severe";   sColor = "#dc2626"; sBg = "#fef2f2"; barColor = "#ef4444"; }
  else if (congestion >= 50) { status = "High";     sColor = "#ea580c"; sBg = "#fff7ed"; barColor = "#f97316"; }
  else if (congestion >= 25) { status = "Moderate"; sColor = "#d97706"; sBg = "#fffbeb"; barColor = "#f59e0b"; }
  else                       { status = "Clear";    sColor = "#16a34a"; sBg = "#f0fdf4"; barColor = "#22c55e"; }
  return { name, congestion, vehicles, speed, status, sColor, sBg, barColor };
}

function buildSnapshot() { return ALL_ROADS.map(genRoad); }

// ── Incident engine ───────────────────────────────────────────────────────────
const INCIDENT_TYPES = [
  { type: "Accident",      icon: "🚨", severities: ["Critical","High"],           ttl: [8,15] },
  { type: "Road Closure",  icon: "🚧", severities: ["Critical","High"],           ttl: [12,25] },
  { type: "Construction",  icon: "🏗️", severities: ["Medium","Low"],             ttl: [20,40] },
  { type: "Congestion",    icon: "🚗", severities: ["High","Medium","Low"],       ttl: [5,12] },
  { type: "Debris",        icon: "⚠️", severities: ["High","Medium"],            ttl: [4,10] },
  { type: "Emergency Veh.",icon: "🚑", severities: ["High","Medium"],            ttl: [3,7]  },
  { type: "Flooding",      icon: "🌊", severities: ["Critical","High"],           ttl: [15,30] },
  { type: "Signal Fault",  icon: "🚦", severities: ["Medium","Low"],             ttl: [6,18] },
];

const SEV_CONFIG = {
  Critical: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", dot: "#ef4444", ring: "#dc262630" },
  High:     { color: "#ea580c", bg: "#fff7ed", border: "#fed7aa", dot: "#f97316", ring: "#ea580c30" },
  Medium:   { color: "#d97706", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b", ring: "#d9770630" },
  Low:      { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", dot: "#22c55e", ring: "#16a34a30" },
};

let _incId = 1;
function makeIncident(roads) {
  const def = INCIDENT_TYPES[Math.floor(Math.random() * INCIDENT_TYPES.length)];
  const road = roads[Math.floor(Math.random() * roads.length)];
  const sev = def.severities[Math.floor(Math.random() * def.severities.length)];
  const [tMin, tMax] = def.ttl;
  const ttlMin = tMin + Math.floor(Math.random() * (tMax - tMin));
  const now = new Date();
  return {
    id: _incId++,
    type: def.type,
    icon: def.icon,
    severity: sev,
    road: road.name,
    time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    ttlMin,
    expiresAt: Date.now() + ttlMin * 60 * 1000,
    createdAt: Date.now(),
    desc: buildDesc(def.type, road, sev),
  };
}

function buildDesc(type, road, sev) {
  const descs = {
    "Accident":       [`Multi-vehicle collision reported`, `Rear-end collision blocking lane`, `Fender-bender cleared to shoulder`],
    "Road Closure":   [`Full road closure — seek alternate route`, `Lane closure reducing capacity 50%`, `Emergency closure by traffic authority`],
    "Construction":   [`Ongoing resurfacing work`, `Water main repair narrowing road`, `Bridge maintenance — single lane`],
    "Congestion":     [`Unusually heavy vehicle buildup`, `Queue extends back ${Math.floor(Math.random()*3+1)} km`, `Slow-moving traffic — delay expected`],
    "Debris":         [`Fallen debris on carriageway`, `Object on road — caution advised`, `Tyre debris causing hazard`],
    "Emergency Veh.": [`Emergency response vehicles en route`, `Ambulance corridor — keep lane clear`, `Fire brigade responding to incident`],
    "Flooding":       [`Surface water across road`, `Flash flooding — reduce speed`, `Standing water — risk of aquaplaning`],
    "Signal Fault":   [`Traffic signal malfunction`, `Lights on manual control by police`, `Signal out — treat as stop sign`],
  };
  const pool = descs[type] || [`Incident on ${road.name}`];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Network health ring ───────────────────────────────────────────────────────
function HealthRing({ value }) {
  const R = 54, cx = 64, cy = 64, stroke = 10;
  const circ = 2 * Math.PI * R;
  const dash = (value / 100) * circ;
  const color = value <= 30 ? "#22c55e" : value <= 55 ? "#f59e0b" : value <= 75 ? "#f97316" : "#ef4444";
  const label = value <= 30 ? "Excellent" : value <= 55 ? "Normal" : value <= 75 ? "Stressed" : "Critical";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={128} height={128}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.8s ease" }} />
        <text x={cx} y={cy - 6}  textAnchor="middle" fontSize={20} fontWeight={800} fill={color}>{value}%</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fill="#9ca3af">congestion</text>
      </svg>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{label}</span>
    </div>
  );
}

function Sparkline({ history }) {
  if (history.length < 2) return null;
  const W = 120, H = 36, max = Math.max(...history, 1);
  const step = W / (history.length - 1);
  const pts  = history.map((v, i) => `${i * step},${H - (v / max) * H}`).join(" ");
  const area = `0,${H} ${pts} ${(history.length - 1) * step},${H}`;
  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#2563eb" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sg)" />
      <polyline points={pts} fill="none" stroke="#2563eb" strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  );
}

function MiniBar({ value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 28 }}>{value}%</span>
    </div>
  );
}

// ── Toast notification ────────────────────────────────────────────────────────
function IncidentToast({ inc, onDismiss }) {
  const cfg = SEV_CONFIG[inc.severity];
  const [progress, setProgress] = useState(100);
  const DISPLAY_MS = 7000;

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / DISPLAY_MS) * 100);
      setProgress(pct);
      if (pct <= 0) { clearInterval(t); onDismiss(inc.id); }
    }, 50);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      background: "white", borderRadius: 12, overflow: "hidden",
      boxShadow: "0 8px 28px rgba(0,0,0,0.15)", border: `1px solid ${cfg.border}`,
      width: 320, position: "relative", animation: "slideIn 0.3s ease",
    }}>
      {/* Color left stripe */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: cfg.dot }} />
      <div style={{ padding: "12px 14px 10px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 20 }}>{inc.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{inc.type}</div>
              <div style={{ fontSize: 11, color: cfg.color, fontWeight: 700 }}>{inc.severity} severity</div>
            </div>
          </div>
          <button onClick={() => onDismiss(inc.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16, padding: 0, lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: "#374151" }}>📍 {inc.road}</div>
        <div style={{ marginTop: 3, fontSize: 12, color: "#6b7280" }}>{inc.desc}</div>
        <div style={{ marginTop: 6, fontSize: 11, color: "#9ca3af" }}>
          🕐 {inc.time} · est. clear in {inc.ttlMin} min
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ height: 3, background: "#f3f4f6" }}>
        <div style={{ width: `${progress}%`, height: "100%", background: cfg.dot, transition: "width 0.05s linear" }} />
      </div>
    </div>
  );
}

// ── Active incident row ───────────────────────────────────────────────────────
function IncidentRow({ inc, onClear }) {
  const cfg = SEV_CONFIG[inc.severity];
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - inc.createdAt) / 60000)), 10000);
    return () => clearInterval(t);
  }, [inc.createdAt]);

  const remaining = Math.max(0, inc.ttlMin - elapsed);

  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px",
      background: cfg.bg, borderRadius: 10, border: `1px solid ${cfg.border}`,
      position: "relative", overflow: "hidden",
    }}>
      {/* Severity dot pulse */}
      <div style={{ marginTop: 3, flexShrink: 0 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.dot, boxShadow: `0 0 0 3px ${cfg.ring}` }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 14 }}>{inc.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>{inc.type}</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: cfg.dot + "22", color: cfg.color }}>{inc.severity}</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{inc.road}</div>
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{inc.desc}</div>
        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4, display: "flex", gap: 10 }}>
          <span>🕐 {inc.time}</span>
          <span>{remaining > 0 ? `~${remaining} min to clear` : "Clearing…"}</span>
        </div>
      </div>
      <button onClick={() => onClear(inc.id)} title="Mark cleared" style={{
        background: "none", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer",
        color: "#9ca3af", fontSize: 11, padding: "3px 8px", whiteSpace: "nowrap",
        flexShrink: 0, fontWeight: 600,
      }}>✓ Clear</button>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [roads, setRoads] = useState(() => buildSnapshot());
  const [incidents, setIncidents] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [congHistory, setCongHistory] = useState([]);
  const [countdown, setCountdown] = useState(30);
  const [now, setNow] = useState(new Date());
  const [showIncPanel, setShowIncPanel] = useState(false);
  const toastTimers = useRef({});
  const [locInfo, setLocInfo] = useState(null);

  const spawnIncident = useCallback((roads) => {
    const inc = makeIncident(roads);
    setIncidents(prev => [inc, ...prev].slice(0, 20));
    setToasts(prev => [inc, ...prev].slice(0, 4));
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearIncident = useCallback((id) => {
    setIncidents(prev => prev.filter(i => i.id !== id));
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Seed initial incident
  useEffect(() => {
    const avg = Math.round(roads.reduce((s, r) => s + r.congestion, 0) / roads.length);
    const seed = Array.from({ length: 6 }, (_, i) => Math.max(5, avg + (i - 3) * 4 + Math.round(Math.random() * 8)));
    setCongHistory(seed);
    // Start with 2-3 pre-existing incidents
    const snap = buildSnapshot();
    for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
      const inc = makeIncident(snap);
      inc.createdAt -= Math.floor(Math.random() * 8) * 60000; // 0-8 min ago
      setIncidents(prev => [inc, ...prev]);
    }
  }, []);

  // Auto-expire incidents
  useEffect(() => {
    const t = setInterval(() => {
      setIncidents(prev => prev.filter(i => Date.now() < i.expiresAt));
    }, 30000);
    return () => clearInterval(t);
  }, []);

  // Refresh roads + maybe spawn incident
  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          const snap = buildSnapshot();
          setRoads(snap);
          const avg = Math.round(snap.reduce((s, r) => s + r.congestion, 0) / snap.length);
          setCongHistory(h => [...h.slice(-11), avg]);
          // ~55% chance of a new incident each refresh
          if (Math.random() < 0.55) spawnIncident(snap);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [spawnIncident]);

  // Geolocation + weather (cached in sessionStorage)
  useEffect(() => {
    const cached = sessionStorage.getItem("_tpLoc");
    if (cached) { try { setLocInfo(JSON.parse(cached)); } catch {} return; }
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lon } = pos.coords;
      try {
        const [geoRes, wxRes] = await Promise.all([
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`),
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`),
        ]);
        const geo = await geoRes.json();
        const wx  = await wxRes.json();
        const city    = geo.address?.city || geo.address?.town || geo.address?.village || geo.address?.county || "Your area";
        const country = geo.address?.country_code?.toUpperCase() || "";
        const temp    = Math.round(wx.current?.temperature_2m ?? 0);
        const code    = wx.current?.weather_code ?? 0;
        const wind    = Math.round(wx.current?.wind_speed_10m ?? 0);
        const info = { city, country, temp, code, wind, lat, lon };
        setLocInfo(info);
        sessionStorage.setItem("_tpLoc", JSON.stringify(info));
      } catch {}
    }, () => {}, { timeout: 9000 });
  }, []);

  // Compute stats
  const avgCong   = Math.round(roads.reduce((s, r) => s + r.congestion, 0) / roads.length);
  const totalVeh  = roads.reduce((s, r) => s + r.vehicles, 0);
  const avgSpeed  = Math.round(roads.reduce((s, r) => s + r.speed, 0) / roads.length);
  const severeCount  = roads.filter(r => r.status === "Severe").length;
  const highCount    = roads.filter(r => r.status === "High").length;
  const clearCount   = roads.filter(r => r.status === "Clear").length;
  const top5    = [...roads].sort((a, b) => b.congestion - a.congestion).slice(0, 5);
  const bottom3 = [...roads].sort((a, b) =>  a.congestion - b.congestion).slice(0, 3);
  const statusDist = ["Clear", "Moderate", "High", "Severe"].map(s => ({
    s, count: roads.filter(r => r.status === s).length,
    color: { Clear: "#22c55e", Moderate: "#f59e0b", High: "#f97316", Severe: "#ef4444" }[s],
  }));
  const criticalInc = incidents.filter(i => i.severity === "Critical").length;
  const totalInc    = incidents.length;

  const QUICK = [
    { icon: "🗺️", label: "Plan a Route",   sub: "Live routing & weather", path: "/route",      bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
    { icon: "📡", label: "Live Monitoring", sub: "12 roads, real-time",    path: "/monitoring", bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
    { icon: "📊", label: "Analytics",       sub: "Charts & trends",        path: "/analytics",  bg: "#fdf4ff", border: "#e9d5ff", text: "#7e22ce" },
    { icon: "🛣️", label: "Traffic Data",   sub: "Manage sensor roads",    path: "/traffic",    bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
  ];

  return (
    <>
      <Navbar />

      {/* ── Toast stack ── */}
      <style>{`
        @keyframes slideIn {
          from { opacity:0; transform: translateX(40px); }
          to   { opacity:1; transform: translateX(0);    }
        }
        @keyframes pulse-dot {
          0%,100% { box-shadow: 0 0 0 3px rgba(239,68,68,0.3); }
          50%     { box-shadow: 0 0 0 6px rgba(239,68,68,0.1); }
        }
      `}</style>
      <div style={{
        position: "fixed", top: 72, right: 20, zIndex: 9000,
        display: "flex", flexDirection: "column", gap: 10,
        pointerEvents: "none",
      }}>
        {toasts.map(inc => (
          <div key={inc.id} style={{ pointerEvents: "auto" }}>
            <IncidentToast inc={inc} onDismiss={dismissToast} />
          </div>
        ))}
      </div>

      <div style={{ padding: "24px 32px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, color: "#0f172a" }}>Command Center</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
              {now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })} · {now.toLocaleTimeString()} · Network refreshes in <strong style={{ color: countdown <= 8 ? "#dc2626" : "#374151" }}>{countdown}s</strong>
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Incident badge */}
            <button onClick={() => setShowIncPanel(v => !v)} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 14px",
              background: criticalInc > 0 ? "#fef2f2" : totalInc > 0 ? "#fff7ed" : "#f0fdf4",
              border: `1px solid ${criticalInc > 0 ? "#fecaca" : totalInc > 0 ? "#fed7aa" : "#bbf7d0"}`,
              borderRadius: 8, cursor: "pointer",
              fontSize: 13, fontWeight: 700,
              color: criticalInc > 0 ? "#dc2626" : totalInc > 0 ? "#ea580c" : "#16a34a",
            }}>
              {totalInc > 0 ? (
                <>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: criticalInc > 0 ? "#dc2626" : "#f97316", animation: "pulse-dot 1.4s infinite" }} />
                  {totalInc} Active Incident{totalInc !== 1 ? "s" : ""}
                  {criticalInc > 0 && <span style={{ fontSize: 11 }}>({criticalInc} critical)</span>}
                  <span style={{ fontSize: 11 }}>{showIncPanel ? "▲" : "▼"}</span>
                </>
              ) : "✅ No Active Incidents"}
            </button>
            <div style={{ padding: "7px 14px", background: severeCount > 0 ? "#fef2f2" : "#f0fdf4", border: `1px solid ${severeCount > 0 ? "#fecaca" : "#bbf7d0"}`, borderRadius: 8, fontSize: 13, fontWeight: 700, color: severeCount > 0 ? "#dc2626" : "#16a34a" }}>
              {severeCount > 0 ? `🔴 ${severeCount} Severe Road${severeCount > 1 ? "s" : ""}` : "🟢 Roads Normal"}
            </div>
          </div>
        </div>

        {/* ── Active Incidents Panel (expandable) ── */}
        {showIncPanel && (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>🚨 Active Incidents</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Auto-cleared when resolved. Click ✓ Clear to manually dismiss.</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["Critical","High","Medium","Low"].map(sev => {
                  const cnt = incidents.filter(i => i.severity === sev).length;
                  if (!cnt) return null;
                  const cfg = SEV_CONFIG[sev];
                  return (
                    <div key={sev} style={{ padding: "3px 10px", borderRadius: 99, background: cfg.bg, border: `1px solid ${cfg.border}`, fontSize: 11, fontWeight: 700, color: cfg.color }}>
                      {cnt} {sev}
                    </div>
                  );
                })}
              </div>
            </div>
            {incidents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "#9ca3af", fontSize: 14 }}>✅ All clear — no active incidents</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
                {incidents.map(inc => (
                  <IncidentRow key={inc.id} inc={inc} onClear={clearIncident} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Location / Weather Banner ── */}
        {locInfo && (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 20px", marginBottom: 18, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>📍</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                  {locInfo.city}{locInfo.country ? `, ${locInfo.country}` : ""}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Your detected location</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, borderLeft: "1px solid #e5e7eb", paddingLeft: 20 }}>
              <span style={{ fontSize: 26 }}>{WMO_ICONS[locInfo.code] || "🌡️"}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{locInfo.temp}°C</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>💨 {locInfo.wind} km/h wind</div>
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => navigate(`/route`)} style={{ padding: "7px 14px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, color: "#1d4ed8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                🗺️ Plan Route
              </button>
              <button onClick={() => navigate("/prediction")} style={{ padding: "7px 14px", background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: 8, color: "#7e22ce", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                📈 Predict Traffic
              </button>
            </div>
          </div>
        )}

        {/* ── KPI Row ── */}
        <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { icon: "🛣️", label: "Roads Monitored",   value: roads.length,              color: "#1e3a5f", sub: "active sensors" },
            { icon: "📊", label: "Avg Network Cong.", value: `${avgCong}%`,             color: avgCong >= 60 ? "#dc2626" : avgCong >= 35 ? "#d97706" : "#16a34a", sub: "real-time" },
            { icon: "🚗", label: "Vehicles / hr",     value: totalVeh.toLocaleString(), color: "#0891b2", sub: "combined" },
            { icon: "⚡", label: "Avg Speed",         value: `${avgSpeed} km/h`,        color: "#7c3aed", sub: "network avg" },
            { icon: "🚨", label: "Active Incidents",  value: totalInc,                  color: criticalInc > 0 ? "#dc2626" : totalInc > 0 ? "#ea580c" : "#16a34a", sub: `${criticalInc} critical` },
            { icon: "🟢", label: "Clear Roads",       value: clearCount,                color: "#16a34a", sub: `${roads.length - clearCount} have delays` },
          ].map(({ icon, label, value, color, sub }) => (
            <div key={label} style={{ flex: 1, minWidth: 130, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginTop: 2 }}>{label}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* ── Main grid ── */}
        <div style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>

          {/* Left column */}
          <div style={{ flex: 3, minWidth: 280, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Most congested */}
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>🔴 Most Congested Roads</div>
                <button onClick={() => navigate("/monitoring")} style={{ fontSize: 12, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>View all →</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {top5.map((r, i) => {
                  const roadIncs = incidents.filter(inc => inc.road === r.name);
                  return (
                    <div key={r.name} onClick={() => navigate(`/prediction?road=${encodeURIComponent(r.name)}`)} title={`View prediction for ${r.name}`} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderRadius: 8, padding: "4px 6px", margin: "-4px -6px", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background="#f8fafc"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                      <div style={{ width: 22, height: 22, borderRadius: 99, background: i === 0 ? "#fef2f2" : i === 1 ? "#fff7ed" : "#f8fafc", color: i === 0 ? "#dc2626" : i === 1 ? "#ea580c" : "#94a3b8", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                          {r.name}
                          {roadIncs.map(ri => <span key={ri.id} title={`${ri.type}: ${ri.desc}`} style={{ fontSize: 14 }}>{ri.icon}</span>)}
                        </div>
                        <MiniBar value={r.congestion} color={r.barColor} />
                      </div>
                      <div style={{ textAlign: "right", minWidth: 68 }}>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{r.vehicles.toLocaleString()} veh/hr</div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: r.sBg, color: r.sColor }}>{r.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommended routes */}
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 15, marginBottom: 16 }}>🟢 Recommended Routes (Least Congested)</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {bottom3.map(r => {
                  const hasInc = incidents.some(i => i.road === r.name);
                  return (
                    <div key={r.name} style={{ flex: 1, minWidth: 160, background: hasInc ? "#fffbeb" : "#f0fdf4", border: `1px solid ${hasInc ? "#fde68a" : "#bbf7d0"}`, borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: hasInc ? "#92400e" : "#15803d", marginBottom: 6 }}>
                        {hasInc ? "⚠️" : "✅"} {r.name}
                      </div>
                      <div style={{ fontSize: 12, color: "#374151" }}>🚗 {r.speed} km/h avg</div>
                      <div style={{ fontSize: 12, color: "#374151" }}>📊 {r.congestion}% congestion</div>
                      <div style={{ fontSize: 12, color: "#374151" }}>🚙 {r.vehicles.toLocaleString()} veh/hr</div>
                      {hasInc && <div style={{ fontSize: 11, color: "#d97706", marginTop: 6 }}>⚠️ Active incident reported</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ flex: 2, minWidth: 260, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Network Health */}
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 15, alignSelf: "flex-start", marginBottom: 16 }}>🌐 Network Health</div>
              <HealthRing value={avgCong} />
              <div style={{ width: "100%", marginTop: 20 }}>
                {statusDist.map(({ s, count, color }) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                      <span style={{ fontSize: 12, color: "#374151" }}>{s}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 80, height: 5, background: "#f3f4f6", borderRadius: 99 }}>
                        <div style={{ width: `${(count / roads.length) * 100}%`, height: "100%", background: color, borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 16, textAlign: "right" }}>{count}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid #f3f4f6", width: "100%", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Trend (last 12 reads)</span>
                <Sparkline history={congHistory} />
              </div>
            </div>

            {/* Recent Incidents Feed */}
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", flex: 1 }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>🚨 Incident Feed</span>
                {incidents.length > 0 && (
                  <button onClick={() => setIncidents([])} style={{ fontSize: 11, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Clear all</button>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                {incidents.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "24px 0" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                    No active incidents
                  </div>
                ) : (
                  incidents.slice(0, 8).map(inc => {
                    const cfg = SEV_CONFIG[inc.severity];
                    const elapsed = Math.floor((Date.now() - inc.createdAt) / 60000);
                    const remaining = Math.max(0, inc.ttlMin - elapsed);
                    return (
                      <div key={inc.id} style={{ display: "flex", gap: 8, padding: "9px 12px", background: cfg.bg, borderRadius: 8, border: `1px solid ${cfg.border}`, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 16, marginTop: 1 }}>{inc.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{inc.type}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color }}>{inc.severity}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#374151", fontWeight: 600, marginTop: 1 }}>{inc.road.split(" ").slice(0, 3).join(" ")}</div>
                          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                            {inc.time} · {remaining > 0 ? `~${remaining}m left` : "clearing…"}
                          </div>
                        </div>
                        <button onClick={() => clearIncident(inc.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 13, padding: 0, flexShrink: 0, lineHeight: 1, marginTop: 2 }}>✕</button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 15, marginBottom: 16 }}>⚡ Quick Actions</div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {QUICK.map(({ icon, label, sub, path, bg, border, text }) => (
              <button key={path} onClick={() => navigate(path)} style={{
                flex: 1, minWidth: 160, display: "flex", alignItems: "center", gap: 14,
                padding: "16px 20px", background: bg, border: `1px solid ${border}`,
                borderRadius: 12, cursor: "pointer", textAlign: "left",
              }}>
                <div style={{ fontSize: 28 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: text }}>{label}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
