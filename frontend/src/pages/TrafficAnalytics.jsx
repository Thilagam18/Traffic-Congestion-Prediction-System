import React, { useState } from "react";

// ── Data ─────────────────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Realistic hourly congestion % for a weekday
const HOURLY_WEEKDAY = [
  8, 6, 5, 5, 6, 12, 28, 72, 88, 68, 52, 48,
  54, 51, 47, 52, 63, 85, 82, 61, 44, 35, 22, 13,
];
const HOURLY_WEEKEND = [
  5, 4, 4, 4, 5, 8, 14, 22, 32, 44, 52, 58,
  62, 60, 57, 54, 50, 46, 40, 34, 26, 19, 13, 8,
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKLY_TREND = [
  { day: "Mon", avg: 62, peak: 88, low: 8 },
  { day: "Tue", avg: 58, peak: 84, low: 6 },
  { day: "Wed", avg: 65, peak: 91, low: 7 },
  { day: "Thu", avg: 61, peak: 86, low: 6 },
  { day: "Fri", avg: 70, peak: 94, low: 8 },
  { day: "Sat", avg: 42, peak: 65, low: 5 },
  { day: "Sun", avg: 34, peak: 55, low: 4 },
];

const ROADS_DATA = [
  { name: "Market District Road",     weekdayAvg: 74, weekendAvg: 48, peak: 94, vehicles: 12800 },
  { name: "Downtown Main Street",     weekdayAvg: 68, weekendAvg: 44, peak: 91, vehicles: 11200 },
  { name: "Central Avenue",           weekdayAvg: 64, weekendAvg: 40, peak: 88, vehicles: 10500 },
  { name: "East Highway I-42",        weekdayAvg: 61, weekendAvg: 38, peak: 85, vehicles: 15600 },
  { name: "North Ring Road",          weekdayAvg: 55, weekendAvg: 35, peak: 80, vehicles: 9800  },
  { name: "Airport Link Highway",     weekdayAvg: 52, weekendAvg: 46, peak: 78, vehicles: 13200 },
  { name: "West Bridge Corridor",     weekdayAvg: 48, weekendAvg: 30, peak: 72, vehicles: 8400  },
  { name: "South Bypass Expressway",  weekdayAvg: 40, weekendAvg: 25, peak: 65, vehicles: 7600  },
  { name: "Industrial Park Road",     weekdayAvg: 35, weekendAvg: 15, peak: 58, vehicles: 5200  },
  { name: "Riverside Drive",          weekdayAvg: 28, weekendAvg: 22, peak: 45, vehicles: 4100  },
];

// Heatmap: rows = roads (0-4 busiest), cols = hours (0-23)
// Values 0-100
function heatVal(roadIdx, hour) {
  const base = HOURLY_WEEKDAY[hour];
  const roadFactor = 1 - roadIdx * 0.07;
  return Math.min(100, Math.round(base * roadFactor + (Math.sin(roadIdx + hour) * 5)));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function congColor(val) {
  if (val >= 75) return "#ef4444";
  if (val >= 50) return "#f97316";
  if (val >= 25) return "#f59e0b";
  return "#22c55e";
}

function heatColor(val) {
  if (val >= 75) return "#dc2626";
  if (val >= 60) return "#f97316";
  if (val >= 40) return "#f59e0b";
  if (val >= 20) return "#86efac";
  return "#dcfce7";
}

function fmtHour(h) {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

// ── Chart Components ──────────────────────────────────────────────────────────

function HourlyBarChart({ data, title }) {
  const W = 780, H = 220, PAD = { top: 16, right: 16, bottom: 36, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const barW = chartW / data.length - 3;
  const [hover, setHover] = useState(null);

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>{title}</div>
      <div style={{ overflowX: "auto" }}>
        <svg width={W} height={H} style={{ display: "block" }}>
          {/* Y gridlines */}
          {[0, 25, 50, 75, 100].map(v => {
            const y = PAD.top + chartH - (v / 100) * chartH;
            return (
              <g key={v}>
                <line x1={PAD.left} x2={PAD.left + chartW} y1={y} y2={y}
                  stroke={v === 0 ? "#94a3b8" : "#e2e8f0"} strokeWidth={v === 0 ? 1.5 : 1} />
                <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">{v}%</text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((val, i) => {
            const x = PAD.left + i * (chartW / data.length) + 1.5;
            const barH = (val / 100) * chartH;
            const y = PAD.top + chartH - barH;
            const isHover = hover === i;
            return (
              <g key={i}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer" }}
              >
                <rect x={x} y={y} width={barW} height={barH}
                  fill={congColor(val)} opacity={isHover ? 1 : 0.82} rx={2} />
                {isHover && (
                  <g>
                    <rect x={x - 8} y={y - 30} width={50} height={22} rx={4} fill="#1e293b" />
                    <text x={x + 17} y={y - 14} textAnchor="middle" fontSize={11} fill="white" fontWeight={700}>
                      {fmtHour(i)}: {val}%
                    </text>
                  </g>
                )}
                {/* X label every 3 hours */}
                {i % 3 === 0 && (
                  <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize={10} fill="#94a3b8">
                    {fmtHour(i)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function WeeklyLineChart({ data }) {
  const W = 680, H = 220, PAD = { top: 20, right: 24, bottom: 36, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const step = chartW / (data.length - 1);
  const [hover, setHover] = useState(null);

  function pt(i, val) {
    return `${PAD.left + i * step},${PAD.top + chartH - (val / 100) * chartH}`;
  }

  const avgPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${pt(i, d.avg)}`).join(" ");
  const peakPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${pt(i, d.peak)}`).join(" ");
  const areaPath = `${avgPath} L${PAD.left + (data.length - 1) * step},${PAD.top + chartH} L${PAD.left},${PAD.top + chartH} Z`;

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>7-Day Congestion Trend</div>
      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        {[["#2563eb", "Avg congestion"], ["#ef4444", "Peak congestion"]].map(([c, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6b7280" }}>
            <div style={{ width: 20, height: 3, background: c, borderRadius: 2 }} />{l}
          </div>
        ))}
      </div>
      <svg width={W} height={H} style={{ display: "block" }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 25, 50, 75, 100].map(v => {
          const y = PAD.top + chartH - (v / 100) * chartH;
          return (
            <g key={v}>
              <line x1={PAD.left} x2={PAD.left + chartW} y1={y} y2={y}
                stroke={v === 0 ? "#94a3b8" : "#e2e8f0"} strokeWidth={v === 0 ? 1.5 : 1} />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">{v}%</text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={avgPath} fill="none" stroke="#2563eb" strokeWidth={2.5} strokeLinejoin="round" />
        <path d={peakPath} fill="none" stroke="#ef4444" strokeWidth={2} strokeLinejoin="round" strokeDasharray="5,3" />

        {data.map((d, i) => {
          const [ax, ay] = pt(i, d.avg).split(",").map(Number);
          const [px, py] = pt(i, d.peak).split(",").map(Number);
          const isHover = hover === i;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
              <circle cx={ax} cy={ay} r={isHover ? 6 : 4} fill="#2563eb" stroke="white" strokeWidth={2} />
              <circle cx={px} cy={py} r={isHover ? 5 : 3} fill="#ef4444" stroke="white" strokeWidth={2} />
              <text x={ax} y={PAD.top + chartH + 16} textAnchor="middle" fontSize={11} fill="#64748b" fontWeight={600}>{d.day}</text>
              {isHover && (
                <g>
                  <rect x={ax - 38} y={ay - 52} width={76} height={44} rx={5} fill="#1e293b" />
                  <text x={ax} y={ay - 34} textAnchor="middle" fontSize={10} fill="#94a3b8">{d.day}</text>
                  <text x={ax - 4} y={ay - 18} textAnchor="middle" fontSize={11} fill="white">
                    Avg: <tspan fontWeight={700} fill="#93c5fd">{d.avg}%</tspan>
                  </text>
                  <text x={ax - 4} y={ay - 4} textAnchor="middle" fontSize={11} fill="white">
                    Peak: <tspan fontWeight={700} fill="#fca5a5">{d.peak}%</tspan>
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function RoadBarChart({ roads, mode }) {
  const [hover, setHover] = useState(null);
  const W = 680, rowH = 36, PAD = { top: 8, left: 200, right: 60 };
  const chartW = W - PAD.left - PAD.right;
  const H = rowH * roads.length + PAD.top + 8;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={W} height={H} style={{ display: "block" }}>
        {[0, 25, 50, 75, 100].map(v => {
          const x = PAD.left + (v / 100) * chartW;
          return (
            <g key={v}>
              <line x1={x} x2={x} y1={PAD.top} y2={H - 8} stroke="#e2e8f0" strokeWidth={1} />
              <text x={x} y={PAD.top - 2} textAnchor="middle" fontSize={9} fill="#94a3b8">{v}%</text>
            </g>
          );
        })}

        {roads.map((road, i) => {
          const val = mode === "weekday" ? road.weekdayAvg : road.weekendAvg;
          const y = PAD.top + i * rowH;
          const barW = (val / 100) * chartW;
          const isHover = hover === i;

          return (
            <g key={road.name}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            >
              <rect x={0} y={y + 1} width={W} height={rowH - 2}
                fill={isHover ? "#f8fafc" : "transparent"} />
              <text x={PAD.left - 8} y={y + rowH / 2 + 4} textAnchor="end"
                fontSize={11} fill="#374151" fontWeight={isHover ? 700 : 400}>
                {road.name.length > 24 ? road.name.slice(0, 22) + "…" : road.name}
              </text>
              <rect x={PAD.left} y={y + 8} width={barW} height={rowH - 18}
                fill={congColor(val)} opacity={isHover ? 1 : 0.8} rx={3} />
              <text x={PAD.left + barW + 6} y={y + rowH / 2 + 4}
                fontSize={11} fill={congColor(val)} fontWeight={700}>
                {val}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function HeatmapChart() {
  const topRoads = ROADS_DATA.slice(0, 5);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const cellW = 26, cellH = 28;
  const [hover, setHover] = useState(null);

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 0 }}>
        {/* Road labels */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", paddingTop: 22, paddingBottom: 4 }}>
          {topRoads.map((r) => (
            <div key={r.name} style={{ height: cellH, display: "flex", alignItems: "center", paddingRight: 10, fontSize: 11, color: "#374151", fontWeight: 500, whiteSpace: "nowrap" }}>
              {r.name.split(" ").slice(0, 2).join(" ")}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div>
          {/* Hour labels */}
          <div style={{ display: "flex" }}>
            {hours.map(h => (
              <div key={h} style={{ width: cellW, textAlign: "center", fontSize: 9, color: "#9ca3af", marginBottom: 4 }}>
                {h % 3 === 0 ? fmtHour(h) : ""}
              </div>
            ))}
          </div>
          {topRoads.map((road, ri) => (
            <div key={road.name} style={{ display: "flex", marginBottom: 2 }}>
              {hours.map((h) => {
                const val = heatVal(ri, h);
                const key = `${ri}-${h}`;
                const isHover = hover === key;
                return (
                  <div key={h}
                    onMouseEnter={() => setHover(key)}
                    onMouseLeave={() => setHover(null)}
                    title={`${road.name.split(" ").slice(0, 2).join(" ")} @ ${fmtHour(h)}: ${val}%`}
                    style={{
                      width: cellW - 2,
                      height: cellH - 2,
                      background: heatColor(val),
                      marginRight: 2,
                      borderRadius: 3,
                      cursor: "pointer",
                      border: isHover ? "2px solid #1e3a5f" : "2px solid transparent",
                      boxSizing: "border-box",
                      position: "relative",
                    }}
                  />
                );
              })}
            </div>
          ))}
          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 10, color: "#9ca3af" }}>Low</span>
            {["#dcfce7", "#86efac", "#f59e0b", "#f97316", "#dc2626"].map((c) => (
              <div key={c} style={{ width: 20, height: 12, background: c, borderRadius: 2 }} />
            ))}
            <span style={{ fontSize: 10, color: "#9ca3af" }}>High</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TrafficAnalytics() {
  const [dayMode, setDayMode] = useState("weekday");
  const hourlyData = dayMode === "weekday" ? HOURLY_WEEKDAY : HOURLY_WEEKEND;
  const peakHour = hourlyData.indexOf(Math.max(...hourlyData));
  const avgCong = Math.round(hourlyData.reduce((a, b) => a + b, 0) / hourlyData.length);
  const totalVehicles = ROADS_DATA.reduce((s, r) => s + r.vehicles, 0);
  const worstRoad = ROADS_DATA[0];

  return (
    <>
      
      <div style={{ padding: "24px 32px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, color: "#0f172a" }}>Traffic Analytics</h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
              Historical congestion patterns, peak hour analysis, and road-by-road comparisons
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: 4 }}>
            {["weekday", "weekend"].map((m) => (
              <button key={m} onClick={() => setDayMode(m)} style={{
                padding: "6px 16px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                background: dayMode === m ? "#1e3a5f" : "transparent",
                color: dayMode === m ? "white" : "#6b7280",
              }}>
                {m === "weekday" ? "Weekday" : "Weekend"}
              </button>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { icon: "📊", label: "Daily Avg Congestion", value: `${avgCong}%`, sub: `${dayMode} average`, color: avgCong >= 50 ? "#dc2626" : "#d97706" },
            { icon: "⏰", label: "Peak Hour",            value: fmtHour(peakHour), sub: `${hourlyData[peakHour]}% congestion`, color: "#1e3a5f" },
            { icon: "🚗", label: "Daily Vehicle Count",  value: totalVehicles.toLocaleString(), sub: "across all roads", color: "#0891b2" },
            { icon: "🔴", label: "Worst Road",           value: worstRoad.name.split(" ").slice(0, 2).join(" "), sub: `${dayMode === "weekday" ? worstRoad.weekdayAvg : worstRoad.weekendAvg}% avg`, color: "#dc2626" },
            { icon: "📈", label: "Busiest Day",          value: "Friday",        sub: "70% avg · 94% peak",   color: "#7c3aed" },
          ].map(({ icon, label, value, sub, color }) => (
            <div key={label} style={{ flex: 1, minWidth: 150, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 2 }}>{label}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Hourly + Weekly row */}
        <div style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 3, minWidth: 300, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
            <HourlyBarChart data={hourlyData} title={`Hourly Congestion — ${dayMode === "weekday" ? "Weekday" : "Weekend"}`} />
            <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
              {[["🌅 Morning rush", "7–9 AM", "#f97316"], ["🌆 Evening rush", "5–7 PM", "#ef4444"], ["🌙 Off-peak", "10 PM–6 AM", "#22c55e"]].map(([label, time, color]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280" }}>
                  <div style={{ width: 10, height: 10, background: color, borderRadius: 2 }} />
                  <span>{label}</span>
                  <span style={{ color: "#9ca3af" }}>({time})</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 2, minWidth: 280, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
            <WeeklyLineChart data={WEEKLY_TREND} />
          </div>
        </div>

        {/* Road comparison + Heatmap */}
        <div style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: 300, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
              Road-by-Road Comparison
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>
              Average congestion by road — hover for details
            </div>
            <RoadBarChart roads={ROADS_DATA} mode={dayMode} />
          </div>

          <div style={{ flex: 1, minWidth: 300, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
              Hourly Heatmap — Top 5 Roads
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>
              Congestion intensity by hour (hover for value)
            </div>
            <HeatmapChart />
          </div>
        </div>

        {/* Insights */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>💡 Key Insights</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { color: "#ef4444", bg: "#fef2f2", icon: "🔴", title: "Peak congestion window", body: "Worst traffic occurs between 7–9 AM and 5–7 PM on weekdays. Market District Road and Downtown Main Street are consistently the most congested." },
              { color: "#d97706", bg: "#fffbeb", icon: "🟡", title: "Friday is the busiest day", body: "Friday averages 70% congestion with peaks reaching 94%. Plan ahead — especially on the East Highway and Central Avenue." },
              { color: "#16a34a", bg: "#f0fdf4", icon: "🟢", title: "Best travel windows", body: "10 PM – 6 AM sees the lowest congestion across all roads. Riverside Drive and Industrial Park Road remain clear most of the day." },
              { color: "#0891b2", bg: "#ecfeff", icon: "📉", title: "Weekend relief", body: "Weekend congestion drops ~40% from weekday levels. Average falls from 48% to 34%, with peak hours shifting to midday (11 AM–2 PM) instead of rush hours." },
            ].map(({ color, bg, icon, title, body }) => (
              <div key={title} style={{ flex: 1, minWidth: 220, background: bg, border: `1px solid ${color}30`, borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 6 }}>{icon} {title}</div>
                <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
