import React, { useState, useEffect, useRef, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Navbar from "../components/Navbar";

delete L.Icon.Default.prototype._getIconUrl;

// ── Markers ───────────────────────────────────────────────────────────────────
function makePin(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:32px;height:42px;position:relative;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35))">
      <svg viewBox="0 0 32 42" width="32" height="42" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26S32 26 32 16C32 7.163 24.837 0 16 0z" fill="${color}"/>
        <circle cx="16" cy="16" r="7" fill="white"/>
      </svg>
    </div>`,
    iconSize: [32, 42], iconAnchor: [16, 42], popupAnchor: [0, -44],
  });
}

function makeNavDot() {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:24px;height:24px">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(26,115,232,0.25);animation:navRing 1.5s ease-out infinite"></div>
      <div style="position:absolute;inset:4px;border-radius:50%;background:#1a73e8;border:3px solid white;box-shadow:0 2px 8px rgba(26,115,232,0.6)"></div>
    </div>`,
    iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -14],
  });
}

// ── Tile layers ───────────────────────────────────────────────────────────────
const TILE_LAYERS = {
  road: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 20,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 19,
  },
};

// ── WMO codes ─────────────────────────────────────────────────────────────────
const WMO = {
  0: { desc: "Clear sky", emoji: "☀️", impact: 0 }, 1: { desc: "Mainly clear", emoji: "🌤️", impact: 0 },
  2: { desc: "Partly cloudy", emoji: "⛅", impact: 0 }, 3: { desc: "Overcast", emoji: "☁️", impact: 0 },
  45: { desc: "Foggy", emoji: "🌫️", impact: 1 }, 48: { desc: "Icy fog", emoji: "🌫️", impact: 2 },
  51: { desc: "Light drizzle", emoji: "🌦️", impact: 1 }, 53: { desc: "Drizzle", emoji: "🌦️", impact: 1 },
  55: { desc: "Dense drizzle", emoji: "🌦️", impact: 1 }, 61: { desc: "Light rain", emoji: "🌧️", impact: 1 },
  63: { desc: "Moderate rain", emoji: "🌧️", impact: 1 }, 65: { desc: "Heavy rain", emoji: "🌧️", impact: 2 },
  71: { desc: "Light snow", emoji: "🌨️", impact: 1 }, 73: { desc: "Moderate snow", emoji: "🌨️", impact: 2 },
  75: { desc: "Heavy snow", emoji: "❄️", impact: 2 }, 80: { desc: "Rain showers", emoji: "🌧️", impact: 1 },
  81: { desc: "Showers", emoji: "🌧️", impact: 1 }, 82: { desc: "Heavy showers", emoji: "⛈️", impact: 2 },
  95: { desc: "Thunderstorm", emoji: "⛈️", impact: 2 }, 96: { desc: "Storm + hail", emoji: "⛈️", impact: 2 },
  99: { desc: "Heavy storm", emoji: "⛈️", impact: 2 },
};
function wmoInfo(code) { return WMO[code] || { desc: "Unknown", emoji: "🌡️", impact: 0 }; }

// ── Traffic prediction ────────────────────────────────────────────────────────
function predictTraffic(srcCode, dstCode, distanceKm) {
  const now = new Date();
  const hour = now.getHours(), day = now.getDay();
  const isWeekend = day === 0 || day === 6;
  const isMorningRush = hour >= 7 && hour <= 9;
  const isEveningRush = hour >= 17 && hour <= 19;
  const isRushHour = isMorningRush || isEveningRush;
  let score = 0;
  if (!isWeekend && isRushHour) score += 60;
  else if (!isWeekend) score += 28;
  else if (isRushHour) score += 18;
  else score += 10;
  const maxImpact = Math.max(wmoInfo(srcCode).impact, wmoInfo(dstCode).impact);
  if (maxImpact === 2) score += 25; else if (maxImpact === 1) score += 12;
  if (distanceKm > 50) score += 6;
  if (distanceKm > 150) score += 6;
  score = Math.min(score, 100);
  const period = isRushHour ? (isMorningRush ? "Morning rush hour" : "Evening rush hour") : isWeekend ? "Weekend, light traffic" : "Off-peak hours";
  if (score >= 68) return { level: "High",     color: "#dc2626", barColor: "#ef4444", bg: "#fef2f2", score, period, factor: 1.5 };
  if (score >= 38) return { level: "Moderate", color: "#d97706", barColor: "#f59e0b", bg: "#fffbeb", score, period, factor: 1.25 };
  return { level: "Low", color: "#16a34a", barColor: "#22c55e", bg: "#f0fdf4", score, period, factor: 1.0 };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDuration(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}
function fmtDist(m) { return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`; }
function getStepIcon(maneuver) {
  const t = maneuver?.type || "", mod = maneuver?.modifier || "";
  if (t === "arrive") return "🏁"; if (t === "depart") return "🚦";
  if (mod.includes("left")) return "↰"; if (mod.includes("right")) return "↱";
  if (t === "roundabout" || t === "rotary") return "🔄";
  if (t === "merge") return "⤵"; if (t === "fork") return "⑂";
  return "↑";
}
function distanceBetween(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── API calls ─────────────────────────────────────────────────────────────────
async function geocode(query) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, { headers: { "Accept-Language": "en" } });
  const data = await res.json();
  if (!data.length) throw new Error(`Location not found: "${query}"`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), name: data[0].display_name };
}
async function reverseGeocode(lat, lon) {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, { headers: { "Accept-Language": "en" } });
  const data = await res.json();
  return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}
async function fetchRoute(sLat, sLon, dLat, dLon) {
  const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${sLon},${sLat};${dLon},${dLat}?steps=true&geometries=geojson&overview=full`);
  const data = await res.json();
  if (data.code !== "Ok") throw new Error("No driving route found between these locations.");
  return data.routes[0];
}
async function fetchWeather(lat, lon) {
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto`);
  return res.json();
}

// ── Map component ─────────────────────────────────────────────────────────────
function LeafletMap({ result, mapStyle, navPos, navigating, currentStepIdx }) {
  const mapRef          = useRef(null);
  const mapInstanceRef  = useRef(null);
  const tileLayerRef    = useRef(null);
  const layersRef       = useRef([]);
  const navMarkerRef    = useRef(null);
  const stepLayersRef   = useRef([]);

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    mapInstanceRef.current = L.map(mapRef.current, { zoomControl: false, attributionControl: true });
    L.control.zoom({ position: "bottomright" }).addTo(mapInstanceRef.current);
    const cfg = TILE_LAYERS[mapStyle];
    tileLayerRef.current = L.tileLayer(cfg.url, { attribution: cfg.attribution, maxZoom: cfg.maxZoom }).addTo(mapInstanceRef.current);
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  // Swap tile layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    const cfg = TILE_LAYERS[mapStyle];
    tileLayerRef.current = L.tileLayer(cfg.url, { attribution: cfg.attribution, maxZoom: cfg.maxZoom }).addTo(map);
    tileLayerRef.current.bringToBack();
  }, [mapStyle]);

  // Draw route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !result) return;
    layersRef.current.forEach(l => map.removeLayer(l));
    layersRef.current = [];
    stepLayersRef.current.forEach(l => map.removeLayer(l));
    stepLayersRef.current = [];

    const coords = result.coords;
    const routeColor = result.traffic.level === "High" ? "#ef4444" : result.traffic.level === "Moderate" ? "#f59e0b" : "#1a73e8";

    const border = L.polyline(coords, { color: "white", weight: 10, opacity: 0.8 }).addTo(map);
    layersRef.current.push(border);
    const line = L.polyline(coords, { color: routeColor, weight: 6, opacity: 0.95 }).addTo(map);
    layersRef.current.push(line);

    const srcM = L.marker([result.src.lat, result.src.lon], { icon: makePin("#34a853") }).addTo(map)
      .bindPopup(`<div style="font-size:13px;font-weight:700">📍 Origin</div><div style="font-size:12px;color:#555;margin-top:4px">${result.src.name.split(",").slice(0, 3).join(", ")}</div>`);
    layersRef.current.push(srcM);
    const dstM = L.marker([result.dst.lat, result.dst.lon], { icon: makePin("#ea4335") }).addTo(map)
      .bindPopup(`<div style="font-size:13px;font-weight:700">🏁 Destination</div><div style="font-size:12px;color:#555;margin-top:4px">${result.dst.name.split(",").slice(0, 3).join(", ")}</div>`);
    layersRef.current.push(dstM);

    map.fitBounds(line.getBounds(), { padding: [60, 60] });
  }, [result]);

  // Navigation dot - update position
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (!navPos) {
      if (navMarkerRef.current) { map.removeLayer(navMarkerRef.current); navMarkerRef.current = null; }
      return;
    }
    if (navMarkerRef.current) {
      navMarkerRef.current.setLatLng([navPos.lat, navPos.lon]);
    } else {
      navMarkerRef.current = L.marker([navPos.lat, navPos.lon], { icon: makeNavDot(), zIndexOffset: 1000 }).addTo(map);
    }
    if (navigating) {
      map.panTo([navPos.lat, navPos.lon], { animate: true, duration: 0.5 });
    }
  }, [navPos, navigating]);

  // Highlight current step waypoint
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !result || currentStepIdx == null) return;
    stepLayersRef.current.forEach(l => map.removeLayer(l));
    stepLayersRef.current = [];
    const step = result.steps[currentStepIdx];
    if (step?.maneuver?.location) {
      const [lon, lat] = step.maneuver.location;
      const circle = L.circleMarker([lat, lon], { radius: 8, color: "#1a73e8", fillColor: "#93c5fd", fillOpacity: 0.8, weight: 2 }).addTo(map);
      stepLayersRef.current.push(circle);
    }
  }, [result, currentStepIdx]);

  return <div ref={mapRef} style={{ height: 480, width: "100%", borderRadius: "0 0 12px 12px" }} />;
}

// ── Weather card ──────────────────────────────────────────────────────────────
function WeatherCard({ label, weather }) {
  if (!weather) return null;
  const c = weather.current;
  const info = wmoInfo(c.weather_code);
  return (
    <div style={{ flex: 1, background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 20px", minWidth: 0 }}>
      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 28, marginBottom: 4 }}>{info.emoji}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>{Math.round(c.temperature_2m)}°C</div>
      <div style={{ fontSize: 13, color: "#374151", margin: "4px 0" }}>{info.desc}</div>
      <div style={{ fontSize: 12, color: "#9ca3af" }}>💨 {Math.round(c.wind_speed_10m)} km/h &nbsp;|&nbsp; 💧 {c.relative_humidity_2m}%</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RouteOptimization() {
  const [source, setSource]           = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [result, setResult]           = useState(null);
  const [mapStyle, setMapStyle]       = useState("road");

  // Navigation state
  const [navigating, setNavigating]     = useState(false);
  const [navPos, setNavPos]             = useState(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [geoError, setGeoError]         = useState("");
  const [locating, setLocating]         = useState(false);
  const watchIdRef = useRef(null);

  const handleFind = async () => {
    if (!source.trim() || !destination.trim()) { setError("Please enter both source and destination."); return; }
    setError(""); setLoading(true); setResult(null); stopNavigation();
    try {
      const [src, dst] = await Promise.all([geocode(source), geocode(destination)]);
      const [routeData, srcWeather, dstWeather] = await Promise.all([
        fetchRoute(src.lat, src.lon, dst.lat, dst.lon),
        fetchWeather(src.lat, src.lon),
        fetchWeather(dst.lat, dst.lon),
      ]);
      const coords = routeData.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const distKm = routeData.distance / 1000;
      const traffic = predictTraffic(srcWeather.current.weather_code, dstWeather.current.weather_code, distKm);
      const steps = routeData.legs[0].steps;
      setResult({ src, dst, routeData, coords, distKm, srcWeather, dstWeather, traffic, adjustedSeconds: routeData.duration * traffic.factor, steps });
      setCurrentStepIdx(0);
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Use my location for origin
  const useMyLocation = () => {
    if (!navigator.geolocation) { setGeoError("Geolocation is not supported by your browser."); return; }
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const name = await reverseGeocode(lat, lon);
          setSource(name.split(",").slice(0, 3).join(","));
        } catch {
          setSource(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
        }
        setLocating(false);
      },
      (err) => {
        setGeoError("Could not get your location. Please allow location access and try again.");
        setLocating(false);
      },
      { timeout: 10000, maximumAge: 30000 }
    );
  };

  // Start navigation (watch GPS position)
  const startNavigation = useCallback(() => {
    if (!navigator.geolocation) { setGeoError("Geolocation not supported."); return; }
    setGeoError("");
    setNavigating(true);
    setCurrentStepIdx(0);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setNavPos({ lat, lon });

        // Auto-advance step based on proximity (within 50m of next step waypoint)
        if (result) {
          setCurrentStepIdx(prev => {
            const nextStep = result.steps[prev + 1];
            if (nextStep?.maneuver?.location) {
              const [stepLon, stepLat] = nextStep.maneuver.location;
              const dist = distanceBetween(lat, lon, stepLat, stepLon);
              if (dist < 50) return Math.min(prev + 1, result.steps.length - 1);
            }
            return prev;
          });
        }
      },
      (err) => {
        setGeoError("GPS unavailable. Make sure location is enabled.");
        setNavigating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
    );
  }, [result]);

  const stopNavigation = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setNavigating(false);
    setNavPos(null);
    setCurrentStepIdx(0);
  }, []);

  useEffect(() => () => { if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current); }, []);

  const activeStep = result?.steps[currentStepIdx];

  return (
    <>
      <Navbar />
      <style>{`
        @keyframes navRing {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
      <div style={{ padding: "24px 32px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
        <h1 style={{ margin: "0 0 4px", color: "#0f172a" }}>Route Optimization</h1>
        <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: 14 }}>
          Real-time routing · Live weather & traffic prediction · GPS turn-by-turn navigation
        </p>

        {/* Search bar */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px", marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>📍 Origin</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="text" placeholder="e.g. New York, USA or use 📍 button"
                value={source} onChange={e => setSource(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleFind()}
                style={{ flex: 1, padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
              />
              <button
                onClick={useMyLocation} disabled={locating} title="Use my current location"
                style={{ padding: "10px 14px", background: locating ? "#f3f4f6" : "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, cursor: locating ? "wait" : "pointer", fontSize: 16, flexShrink: 0 }}
              >
                {locating ? "⟳" : "📍"}
              </button>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>🏁 Destination</label>
            <input
              type="text" placeholder="e.g. Boston, USA"
              value={destination} onChange={e => setDestination(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleFind()}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
            />
          </div>
          <button
            onClick={handleFind} disabled={loading}
            style={{ padding: "10px 28px", backgroundColor: loading ? "#93c5fd" : "#1a73e8", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap", boxShadow: loading ? "none" : "0 2px 6px rgba(26,115,232,0.4)" }}>
            {loading ? "⏳ Analyzing…" : "🔍 Find Best Route"}
          </button>
        </div>

        {(error || geoError) && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", color: "#991b1b", marginBottom: 20, fontSize: 14 }}>
            ⚠️ {error || geoError}
          </div>
        )}

        {result && (
          <>
            {/* Route summary + traffic */}
            <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 2, minWidth: 260, background: "#1a73e8", color: "white", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>Best Route Found</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, lineHeight: 1.6 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#34a853", display: "inline-block", flexShrink: 0 }} />
                    {result.src.name.split(",").slice(0, 2).join(",")}
                  </span>
                  <span style={{ paddingLeft: 18, opacity: 0.5, fontSize: 12 }}>↕ driving</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ea4335", display: "inline-block", flexShrink: 0 }} />
                    {result.dst.name.split(",").slice(0, 2).join(",")}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                  <div><div style={{ fontSize: 26, fontWeight: 800 }}>{fmtDist(result.routeData.distance)}</div><div style={{ fontSize: 11, opacity: 0.7 }}>Total distance</div></div>
                  <div><div style={{ fontSize: 26, fontWeight: 800 }}>{fmtDuration(result.adjustedSeconds)}</div><div style={{ fontSize: 11, opacity: 0.7 }}>Est. with traffic</div></div>
                  <div><div style={{ fontSize: 26, fontWeight: 800 }}>{fmtDuration(result.routeData.duration)}</div><div style={{ fontSize: 11, opacity: 0.7 }}>Base drive time</div></div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 220, background: result.traffic.bg, border: `1px solid ${result.traffic.barColor}50`, borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>🚦 Traffic Prediction</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: result.traffic.color, marginBottom: 4 }}>{result.traffic.level} Congestion</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>{result.traffic.period}</div>
                <div style={{ background: "#e5e7eb", borderRadius: 99, height: 8, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ width: `${result.traffic.score}%`, height: "100%", background: result.traffic.barColor, borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Score: {result.traffic.score}/100 · +{Math.round((result.traffic.factor - 1) * 100)}% added</div>
              </div>
            </div>

            {/* Weather row */}
            <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
              <WeatherCard label="Weather at Origin" weather={result.srcWeather} />
              <WeatherCard label="Weather at Destination" weather={result.dstWeather} />
              <div style={{ flex: 1, minWidth: 200, background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 20px" }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>🛣️ Road Summary</div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 2.1 }}>
                  <div>📏 Distance: <strong>{fmtDist(result.routeData.distance)}</strong></div>
                  <div>⏱️ Base time: <strong>{fmtDuration(result.routeData.duration)}</strong></div>
                  <div>🚦 With traffic: <strong>{fmtDuration(result.adjustedSeconds)}</strong></div>
                  <div>🔀 Maneuvers: <strong>{result.steps.length - 1}</strong></div>
                </div>
              </div>
            </div>

            {/* Navigation controls */}
            <div style={{ background: navigating ? "#eff6ff" : "white", border: `1px solid ${navigating ? "#bfdbfe" : "#e5e7eb"}`, borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                    {navigating ? "🔵 Navigation Active" : "🧭 Start Turn-by-Turn Navigation"}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    {navigating
                      ? "Your live position is shown on the map. Drive safely!"
                      : "Uses your device's GPS to show your live position and guide you step-by-step"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {!navigating ? (
                    <button onClick={startNavigation} style={{ padding: "10px 22px", background: "#1a73e8", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 2px 6px rgba(26,115,232,0.4)" }}>
                      ▶ Start Navigation
                    </button>
                  ) : (
                    <button onClick={stopNavigation} style={{ padding: "10px 22px", background: "#dc2626", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                      ■ Stop Navigation
                    </button>
                  )}
                </div>
              </div>

              {/* Current step banner (when navigating) */}
              {navigating && activeStep && (
                <div style={{ marginTop: 14, background: "#1a73e8", color: "white", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ fontSize: 32 }}>{getStepIcon(activeStep.maneuver)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>
                      {activeStep.maneuver?.instruction || (activeStep.name ? `Continue on ${activeStep.name}` : "Continue straight")}
                    </div>
                    {activeStep.name && <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>🛣️ {activeStep.name}</div>}
                    <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                      Step {currentStepIdx + 1} of {result.steps.length} · {fmtDist(activeStep.distance)}
                      {activeStep.duration > 60 && ` · ~${fmtDuration(activeStep.duration)}`}
                    </div>
                  </div>
                  {navPos && (
                    <div style={{ textAlign: "right", fontSize: 11, opacity: 0.8, flexShrink: 0 }}>
                      <div>🛰️ GPS Active</div>
                      <div>{navPos.lat.toFixed(4)}, {navPos.lon.toFixed(4)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MAP */}
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
              <div style={{ padding: "12px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#1e3a5f", fontSize: 14 }}>
                  🗺️ Route Map
                  {navigating && navPos && <span style={{ marginLeft: 8, fontSize: 12, color: "#1a73e8", fontWeight: 600 }}>● Live tracking</span>}
                </span>
                <div style={{ display: "flex", background: "#f1f3f4", borderRadius: 8, padding: 3, gap: 2 }}>
                  {[{ key: "road", icon: "🗺️", label: "Road" }, { key: "satellite", icon: "🛰️", label: "Satellite" }].map(({ key, icon, label }) => (
                    <button key={key} onClick={() => setMapStyle(key)} style={{
                      padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                      background: mapStyle === key ? "white" : "transparent",
                      color: mapStyle === key ? "#1a73e8" : "#5f6368",
                      boxShadow: mapStyle === key ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                    }}>
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
              <LeafletMap result={result} mapStyle={mapStyle} navPos={navPos} navigating={navigating} currentStepIdx={currentStepIdx} />
            </div>

            {/* Turn-by-turn */}
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #e5e7eb", fontWeight: 700, color: "#1e3a5f", fontSize: 14 }}>
                🧭 Turn-by-Turn Directions ({result.steps.length} steps)
              </div>
              <div style={{ maxHeight: 380, overflowY: "auto" }}>
                {result.steps.map((step, i) => {
                  const isActive = navigating && i === currentStepIdx;
                  return (
                    <div key={i} onClick={() => setCurrentStepIdx(i)} style={{
                      display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 20px",
                      borderBottom: i < result.steps.length - 1 ? "1px solid #f3f4f6" : "none",
                      background: isActive ? "#eff6ff" : i === 0 || i === result.steps.length - 1 ? "#f8fafc" : "white",
                      cursor: "pointer", transition: "background 0.1s",
                      borderLeft: isActive ? "4px solid #1a73e8" : "4px solid transparent",
                    }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: isActive ? "#1a73e8" : i === 0 ? "#e8f5e9" : i === result.steps.length - 1 ? "#e3f2fd" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, color: isActive ? "white" : "inherit" }}>
                        {getStepIcon(step.maneuver)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: "#111", fontWeight: step.name ? 500 : 400 }}>
                          {step.maneuver?.instruction || (step.name ? `Continue on ${step.name}` : "Continue straight")}
                        </div>
                        {step.name && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>🛣️ {step.name}</div>}
                        {isActive && <div style={{ fontSize: 11, color: "#1a73e8", fontWeight: 700, marginTop: 3 }}>▶ Current step</div>}
                      </div>
                      <div style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {fmtDist(step.distance)}
                        {step.duration > 60 && <span style={{ color: "#9ca3af" }}> · {fmtDuration(step.duration)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {!result && !loading && !error && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🗺️</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#6b7280", marginBottom: 8 }}>Enter origin & destination to get started</div>
            <div style={{ fontSize: 14 }}>Live routing · Real weather at both ends · Traffic prediction · GPS turn-by-turn navigation</div>
            <div style={{ marginTop: 16, fontSize: 13, color: "#9ca3af" }}>
              Tip: Click the <strong>📍</strong> button to use your current location as the origin
            </div>
          </div>
        )}
      </div>
    </>
  );
}
