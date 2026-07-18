import React, { useState } from "react";
import Navbar from "../components/Navbar";

function Glass({ children, style = {} }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.10)", borderRadius:16, backdropFilter:"blur(20px)", ...style }}>
      {children}
    </div>
  );
}

const VEHICLE_TYPES = [
  { id:"petrol_car",   label:"Petrol Car",     emoji:"🚗", co2PerLKm:2.31, fuelKmL:12,  eco:false },
  { id:"diesel_car",   label:"Diesel Car",     emoji:"🚙", co2PerLKm:2.68, fuelKmL:15,  eco:false },
  { id:"hybrid",       label:"Hybrid Car",     emoji:"🔋", co2PerLKm:1.60, fuelKmL:20,  eco:true  },
  { id:"electric",     label:"Electric Vehicle",emoji:"⚡", co2PerLKm:0.05, fuelKmL:0,   eco:true  },
  { id:"cng",          label:"CNG Vehicle",    emoji:"🟢", co2PerLKm:1.95, fuelKmL:18,  eco:true  },
  { id:"motorcycle",   label:"Motorcycle",     emoji:"🏍️", co2PerLKm:1.50, fuelKmL:25,  eco:false },
  { id:"bus",          label:"Public Bus",     emoji:"🚌", co2PerLKm:0.089,fuelKmL:0,   eco:true  },
  { id:"truck",        label:"Heavy Truck",    emoji:"🚛", co2PerLKm:0.90, fuelKmL:5,   eco:false },
];

const ROUTES_SAMPLE = [
  { name:"Central Avenue",          distKm:8.2,  congestion:0.62, speedFactor:0.75 },
  { name:"East Highway I-42",       distKm:12.4, congestion:0.55, speedFactor:0.82 },
  { name:"South Bypass Expressway", distKm:14.8, congestion:0.32, speedFactor:0.95 },
  { name:"Riverside Drive",         distKm:7.8,  congestion:0.24, speedFactor:1.00 },
];

function compute(vehicle, route, trips) {
  const dist = route.distKm;
  // Congestion increases fuel consumption
  const congFactor = 1 + route.congestion * 0.35;
  const co2PerKm = vehicle.co2PerLKm * congFactor;
  const tripCo2Kg = (co2PerKm * dist) / 1000;
  const dailyCo2Kg = tripCo2Kg * trips;
  const monthlyCo2Kg = dailyCo2Kg * 22; // working days
  const annualCo2Kg = monthlyCo2Kg * 12;

  const fuelLPer100 = vehicle.fuelKmL > 0 ? (100 / vehicle.fuelKmL) * congFactor : 0;
  const fuelCostPer100 = fuelLPer100 * 1.40; // $/L avg
  const monthlyFuelCost = vehicle.fuelKmL > 0 ? (dist / vehicle.fuelKmL) * congFactor * trips * 22 * 1.40 : 0;

  // Eco-route savings vs current congested route
  const ecoRoute = ROUTES_SAMPLE.reduce((best, r) => r.congestion < best.congestion ? r : best, ROUTES_SAMPLE[0]);
  const ecoFactor = 1 + ecoRoute.congestion * 0.35;
  const ecoCo2Kg = (vehicle.co2PerLKm * ecoFactor * ecoRoute.distKm) / 1000;
  const savingKgPerTrip = Math.max(0, tripCo2Kg - ecoCo2Kg);
  const monthlySavingKg = savingKgPerTrip * trips * 22;

  const trees = (monthlyCo2Kg / 21).toFixed(1); // 1 tree absorbs ~21 kg CO₂/year → /12 per month
  const co2Rating = monthlyCo2Kg < 50 ? "Excellent 🌿" : monthlyCo2Kg < 150 ? "Good ♻️" : monthlyCo2Kg < 300 ? "Average ⚠️" : "High 🔴";

  return { tripCo2Kg, dailyCo2Kg, monthlyCo2Kg, annualCo2Kg, fuelLPer100, monthlyFuelCost, monthlySavingKg, trees, co2Rating, ecoRoute };
}

function Gauge({ value, max, color, label, unit }) {
  const pct = Math.min((value/max)*100, 100);
  const r = 44, cx = 56, cy = 56, sw = 10;
  const circ = Math.PI * r; // semicircle
  const dash = (pct/100) * circ;
  return (
    <div style={{ textAlign:"center" }}>
      <svg width={112} height={70}>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} strokeLinecap="round"/>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round" style={{transition:"stroke-dasharray 0.8s ease"}}/>
        <text x={cx} y={cy-4} textAnchor="middle" fontSize={16} fontWeight={800} fill="white">{value.toFixed(1)}</text>
        <text x={cx} y={cy+12} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.35)">{unit}</text>
      </svg>
      <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{label}</div>
    </div>
  );
}

export default function CarbonEmission() {
  const [vehicle, setVehicle] = useState(VEHICLE_TYPES[0]);
  const [route, setRoute] = useState(ROUTES_SAMPLE[0]);
  const [trips, setTrips] = useState(2);

  const result = compute(vehicle, route, trips);

  const S = {
    page: { backgroundColor:"#0a0f1e", minHeight:"100vh", padding:"28px 32px", fontFamily:"system-ui,sans-serif" },
    label: { fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:6 },
    select: { width:"100%", padding:"10px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, fontSize:13, color:"white", outline:"none", cursor:"pointer" },
  };

  return (
    <>
      <Navbar />
      <style>{`select option{background:#1a1f2e;color:white} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={S.page}>
        {/* Header */}
        <div style={{ marginBottom:28, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#10b981,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🌿</div>
          <div>
            <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:"white" }}>Carbon Emission Module</h1>
            <p style={{ margin:"4px 0 0", color:"rgba(255,255,255,0.45)", fontSize:14 }}>Fuel consumption, CO₂ analysis, eco-route savings, and monthly carbon tracking</p>
          </div>
        </div>

        {/* Controls */}
        <Glass style={{ padding:"24px 28px", marginBottom:24 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"white", marginBottom:18 }}>⚙️ Trip Configuration</div>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            <div style={{ flex:2, minWidth:200 }}>
              <label style={S.label}>Vehicle Type</label>
              <select value={vehicle.id} onChange={e=>setVehicle(VEHICLE_TYPES.find(v=>v.id===e.target.value))} style={S.select}>
                {VEHICLE_TYPES.map(v=><option key={v.id} value={v.id}>{v.emoji} {v.label}</option>)}
              </select>
            </div>
            <div style={{ flex:2, minWidth:200 }}>
              <label style={S.label}>Route</label>
              <select value={route.name} onChange={e=>setRoute(ROUTES_SAMPLE.find(r=>r.name===e.target.value))} style={S.select}>
                {ROUTES_SAMPLE.map(r=><option key={r.name} value={r.name}>{r.name} ({r.distKm} km)</option>)}
              </select>
            </div>
            <div style={{ flex:1, minWidth:120 }}>
              <label style={S.label}>Daily Trips</label>
              <select value={trips} onChange={e=>setTrips(Number(e.target.value))} style={S.select}>
                {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} trip{n>1?"s":""}/day</option>)}
              </select>
            </div>
          </div>
        </Glass>

        {/* KPI row */}
        <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
          {[
            { icon:"💨", label:"Per Trip CO₂",    value:`${(result.tripCo2Kg*1000).toFixed(0)} g`,   color:"#f59e0b", sub:"CO₂ equivalent" },
            { icon:"📅", label:"Daily Emission",  value:`${result.dailyCo2Kg.toFixed(2)} kg`,        color:"#f97316", sub:`${trips} trip(s)/day` },
            { icon:"📆", label:"Monthly CO₂",     value:`${result.monthlyCo2Kg.toFixed(1)} kg`,      color:"#ef4444", sub:"22 working days" },
            { icon:"🌳", label:"Trees to Offset",  value:`${result.trees}`,                          color:"#22c55e", sub:"trees/year needed" },
            { icon:"⛽", label:"Monthly Fuel Cost",value:result.monthlyFuelCost > 0 ? `$${result.monthlyFuelCost.toFixed(0)}` : "Electric",  color:"#38bdf8", sub:"estimated" },
            { icon:"💡", label:"Eco Savings",      value:`${result.monthlySavingKg.toFixed(1)} kg`,  color:"#4ade80", sub:"vs current route" },
          ].map(({icon,label,value,color,sub}) => (
            <Glass key={label} style={{ flex:1, minWidth:130, padding:"18px 20px" }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
              <div style={{ fontSize:20, fontWeight:800, color }}>{value}</div>
              <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.7)", marginTop:4 }}>{label}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{sub}</div>
            </Glass>
          ))}
        </div>

        <div style={{ display:"flex", gap:20, marginBottom:24, flexWrap:"wrap" }}>
          {/* Emission gauges */}
          <Glass style={{ flex:1, minWidth:280, padding:"24px 28px" }}>
            <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:4 }}>{vehicle.emoji} {vehicle.label} Emissions</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:24 }}>Carbon footprint across time horizons</div>
            <div style={{ display:"flex", gap:16, justifyContent:"space-around", flexWrap:"wrap" }}>
              <Gauge value={result.tripCo2Kg*1000} max={5000} color="#f59e0b" label="Per Trip" unit="grams" />
              <Gauge value={result.monthlyCo2Kg} max={500} color="#f97316" label="Monthly" unit="kg CO₂" />
              <Gauge value={result.annualCo2Kg/1000} max={10} color="#ef4444" label="Annual" unit="tonnes" />
            </div>
            <div style={{ marginTop:20, padding:"12px 16px", background: vehicle.eco ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)", border:`1px solid ${vehicle.eco?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.15)"}`, borderRadius:10 }}>
              <div style={{ fontSize:13, fontWeight:700, color: vehicle.eco ? "#4ade80" : "#f87171" }}>
                {vehicle.eco ? "✅ Eco-Friendly Vehicle" : "⚠️ High-Emission Vehicle"}
              </div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginTop:4 }}>CO₂ rating: {result.co2Rating}</div>
            </div>
          </Glass>

          {/* Route comparison */}
          <Glass style={{ flex:2, minWidth:320, padding:"24px 28px" }}>
            <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:4 }}>🛣️ Route Carbon Comparison</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:20 }}>CO₂ per trip across all routes for your vehicle</div>
            {ROUTES_SAMPLE.map(r => {
              const res = compute(vehicle, r, trips);
              const isSelected = r.name === route.name;
              const isEco = r.name === result.ecoRoute.name;
              const pct = (res.tripCo2Kg / (compute(vehicle, ROUTES_SAMPLE[1], trips).tripCo2Kg * 1.5)) * 100;
              const barColor = isEco ? "#22c55e" : isSelected ? "#3b82f6" : "#f59e0b";
              return (
                <div key={r.name} onClick={()=>setRoute(r)} style={{ marginBottom:16, cursor:"pointer", padding:"12px 14px", borderRadius:10, background: isSelected?"rgba(59,130,246,0.08)":"transparent", border:`1px solid ${isSelected?"rgba(59,130,246,0.2)":"transparent"}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:"white" }}>{r.name}</span>
                      {isEco && <span style={{ fontSize:10, padding:"2px 8px", background:"rgba(34,197,94,0.15)", color:"#4ade80", borderRadius:99, fontWeight:700 }}>🌿 Eco Best</span>}
                    </div>
                    <span style={{ fontSize:13, fontWeight:800, color:barColor }}>{(res.tripCo2Kg*1000).toFixed(0)} g</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ flex:1, height:8, background:"rgba(255,255,255,0.06)", borderRadius:99 }}>
                      <div style={{ width:`${Math.min(pct,100)}%`, height:"100%", background:barColor, borderRadius:99, transition:"width 0.8s ease" }} />
                    </div>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", minWidth:40 }}>{r.distKm} km</span>
                  </div>
                </div>
              );
            })}
          </Glass>

          {/* Monthly carbon savings */}
          <Glass style={{ flex:1, minWidth:240, padding:"24px 28px" }}>
            <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:16 }}>💡 Monthly Carbon Savings</div>
            <div style={{ fontSize:36, fontWeight:900, color:"#4ade80", marginBottom:4 }}>{result.monthlySavingKg.toFixed(1)} kg</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", marginBottom:20 }}>Saved by taking the eco route</div>
            <div style={{ padding:"16px", background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.15)", borderRadius:12, marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#4ade80", marginBottom:4 }}>🌿 Best Eco Route</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)" }}>{result.ecoRoute.name}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:4 }}>{result.ecoRoute.distKm} km · {Math.round(result.ecoRoute.congestion*100)}% congestion</div>
            </div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.7 }}>
              💰 Fuel savings: <strong style={{ color:"white" }}>${(result.monthlySavingKg * 0.8).toFixed(0)}/mo</strong><br/>
              🌳 Equivalent trees: <strong style={{ color:"#4ade80" }}>{(result.monthlySavingKg / 1.75).toFixed(1)}</strong><br/>
              📅 Annual CO₂ saved: <strong style={{ color:"#38bdf8" }}>{(result.monthlySavingKg*12/1000).toFixed(2)} t</strong>
            </div>
          </Glass>
        </div>

        {/* Vehicle comparison table */}
        <Glass style={{ padding:"24px 28px" }}>
          <div style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:16 }}>📊 Vehicle Comparison — Same Route</div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr>
                  {["Vehicle","CO₂/Trip","Monthly CO₂","Annual CO₂","Eco Status"].map(h => (
                    <th key={h} style={{ padding:"10px 14px", textAlign:"left", color:"rgba(255,255,255,0.35)", fontSize:10, textTransform:"uppercase", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VEHICLE_TYPES.map(v => {
                  const r = compute(v, route, trips);
                  const isSelected = v.id === vehicle.id;
                  return (
                    <tr key={v.id} onClick={()=>setVehicle(v)} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)", background:isSelected?"rgba(59,130,246,0.08)":"transparent", cursor:"pointer" }}>
                      <td style={{ padding:"12px 14px", fontWeight:600, color:"white" }}>{v.emoji} {v.label}</td>
                      <td style={{ padding:"12px 14px", color:r.tripCo2Kg<0.5?"#4ade80":r.tripCo2Kg<1.5?"#f59e0b":"#f87171", fontWeight:700 }}>{(r.tripCo2Kg*1000).toFixed(0)} g</td>
                      <td style={{ padding:"12px 14px", color:"rgba(255,255,255,0.65)" }}>{r.monthlyCo2Kg.toFixed(1)} kg</td>
                      <td style={{ padding:"12px 14px", color:"rgba(255,255,255,0.65)" }}>{(r.annualCo2Kg/1000).toFixed(2)} t</td>
                      <td style={{ padding:"12px 14px" }}>
                        <span style={{ padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:700, background:v.eco?"rgba(34,197,94,0.12)":"rgba(239,68,68,0.1)", color:v.eco?"#4ade80":"#f87171" }}>
                          {v.eco?"🌿 Eco-Friendly":"🔴 High Emission"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Glass>
      </div>
    </>
  );
}
