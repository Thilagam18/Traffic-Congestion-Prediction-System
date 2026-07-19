import React, { useState, useEffect } from "react";

const BASE_ROADS = [
  { road: "Main Road",       vehicles: 120, trend: +8,  peak: 195 },
  { road: "Highway Road",    vehicles: 200, trend: -3,  peak: 320 },
  { road: "City Road",       vehicles: 150, trend: +12, peak: 240 },
  { road: "Ring Road",       vehicles: 180, trend: +2,  peak: 280 },
  { road: "Express Way",     vehicles: 95,  trend: -15, peak: 170 },
  { road: "North Connector", vehicles: 135, trend: +5,  peak: 210 },
  { road: "South Bypass",    vehicles: 72,  trend: -8,  peak: 130 },
  { road: "East Link",       vehicles: 158, trend: +19, peak: 260 },
];

const COLORS = ["#8b5cf6","#3b82f6","#06b6d4","#10b981","#f59e0b","#f97316","#ec4899","#6366f1"];

function Sparkline({ data, color }) {
  const h = 32, w = 80;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h * 0.9 - h * 0.05;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity="0.8" />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color} opacity="0.08" />
    </svg>
  );
}

export default function TrafficCharts() {
  const [roads, setRoads] = useState(BASE_ROADS);
  const [sort, setSort] = useState("vehicles");
  const [viewMode, setViewMode] = useState("bars"); // bars | cards
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [sparkData, setSparkData] = useState(() =>
    BASE_ROADS.map(() => Array.from({ length: 10 }, () => Math.floor(Math.random() * 200 + 60)))
  );

  const maxVehicles = Math.max(...roads.map(r => r.vehicles));

  const sorted = [...roads].sort((a, b) =>
    sort === "vehicles" ? b.vehicles - a.vehicles :
    sort === "peak"     ? b.peak - a.peak :
    a.road.localeCompare(b.road)
  );

  // Simulate live updates every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRoads(prev => prev.map(r => ({
        ...r,
        vehicles: Math.max(20, r.vehicles + Math.floor(Math.random() * 21) - 10),
      })));
      setSparkData(prev => prev.map(series => [...series.slice(1), Math.floor(Math.random() * 200 + 60)]));
      setLastUpdate(new Date());
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const getLevel = (v) => v > 160 ? { label: "Heavy", color: "#ef4444" } : v > 100 ? { label: "Moderate", color: "#f59e0b" } : { label: "Light", color: "#22c55e" };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes barGrow { from{width:0} to{width:var(--target-width)} }
        .tc-bar { animation: barGrow 0.8s cubic-bezier(0.34,1.56,0.64,1) both; transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1); }
        .tc-tab { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 12px; font-family: inherit; transition: all 0.15s; }
        .tc-tab.active { background: rgba(139,92,246,0.2); border-color: rgba(139,92,246,0.4); color: #c4b5fd; }
        .tc-row { transition: background 0.15s; border-radius: 10px; }
        .tc-row:hover { background: rgba(139,92,246,0.06); }
        .tc-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px 18px; transition: border-color 0.2s, transform 0.15s; }
        .tc-card:hover { border-color: rgba(139,92,246,0.3); transform: translateY(-2px); }
      `}</style>

      <div style={{ background: "#0a0f1e", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", animation: "fadeIn 0.4s ease" }}>

          {/* Header */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#8b5cf6,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📊</div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "white", margin: 0 }}>Traffic Data Visualization</h1>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                Live vehicle counts across {roads.length} monitored roads · Updated {lastUpdate.toLocaleTimeString()}
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Sort:</span>
              {["vehicles","peak","road"].map(s => (
                <button key={s} className={`tc-tab${sort === s ? " active" : ""}`} onClick={() => setSort(s)}>
                  {s === "vehicles" ? "Volume" : s === "peak" ? "Peak" : "A–Z"}
                </button>
              ))}
              <span style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />
              <button className={`tc-tab${viewMode === "bars" ? " active" : ""}`} onClick={() => setViewMode("bars")}>Bars</button>
              <button className={`tc-tab${viewMode === "cards" ? " active" : ""}`} onClick={() => setViewMode("cards")}>Cards</button>
            </div>
          </div>

          {/* Summary strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Total Vehicles", value: roads.reduce((a, r) => a + r.vehicles, 0).toLocaleString(), icon: "🚗" },
              { label: "Busiest Road",   value: [...roads].sort((a,b)=>b.vehicles-a.vehicles)[0]?.road.split(" ")[0], icon: "🔥" },
              { label: "Heavy Traffic",  value: roads.filter(r => r.vehicles > 160).length + " roads", icon: "🔴" },
              { label: "Live Feed",      value: "Active", icon: "🟢" },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "white" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Main chart area */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "24px 24px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>Road-wise Vehicle Count</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />Light</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />Moderate</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />Heavy</span>
              </div>
            </div>

            {viewMode === "bars" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {sorted.map((item, i) => {
                  const pct = (item.vehicles / maxVehicles) * 100;
                  const lvl = getLevel(item.vehicles);
                  const color = COLORS[BASE_ROADS.findIndex(r => r.road === item.road) % COLORS.length];
                  const idx = BASE_ROADS.findIndex(r => r.road === item.road);
                  return (
                    <div key={item.road} className="tc-row" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 16 }}>
                      {/* Road name + badge */}
                      <div style={{ width: 160, flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 3 }}>{item.road}</div>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99,
                          background: `${lvl.color}18`, color: lvl.color, border: `1px solid ${lvl.color}40`,
                        }}>{lvl.label}</span>
                      </div>

                      {/* Bar */}
                      <div style={{ flex: 1, position: "relative" }}>
                        <div style={{ height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                          <div
                            className="tc-bar"
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${color}cc, ${color})`,
                              borderRadius: 99,
                              boxShadow: `0 0 10px ${color}40`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Sparkline */}
                      <div style={{ flexShrink: 0 }}>
                        <Sparkline data={sparkData[idx] || []} color={color} />
                      </div>

                      {/* Count + trend */}
                      <div style={{ width: 80, textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>{item.vehicles.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: item.trend > 0 ? "#4ade80" : "#f87171", marginTop: 2 }}>
                          {item.trend > 0 ? "▲" : "▼"} {Math.abs(item.trend)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                {sorted.map((item, i) => {
                  const lvl = getLevel(item.vehicles);
                  const color = COLORS[BASE_ROADS.findIndex(r => r.road === item.road) % COLORS.length];
                  const idx = BASE_ROADS.findIndex(r => r.road === item.road);
                  const pct = Math.round((item.vehicles / item.peak) * 100);
                  return (
                    <div key={item.road} className="tc-card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{item.road}</div>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: `${lvl.color}18`, color: lvl.color, border: `1px solid ${lvl.color}40` }}>{lvl.label}</span>
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{item.vehicles}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>vehicles · peak {item.peak}</div>
                      <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                        <span style={{ color: "rgba(255,255,255,0.3)" }}>{pct}% of peak</span>
                        <span style={{ color: item.trend > 0 ? "#4ade80" : "#f87171" }}>{item.trend > 0 ? "▲" : "▼"} {Math.abs(item.trend)}%</span>
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <Sparkline data={sparkData[idx] || []} color={color} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
