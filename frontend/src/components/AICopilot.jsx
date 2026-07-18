import React, { useState, useRef, useEffect } from "react";

const HOUR_PROFILE_WD = [
  0.08,0.05,0.04,0.04,0.06,0.14,0.30,0.80,0.95,0.72,0.56,0.52,
  0.58,0.54,0.50,0.55,0.66,0.92,0.88,0.64,0.46,0.36,0.22,0.13,
];
const ROADS = [
  { name:"Market District Road",    baseLoad:0.78 },
  { name:"Downtown Main Street",    baseLoad:0.72 },
  { name:"Central Avenue",          baseLoad:0.68 },
  { name:"East Highway I-42",       baseLoad:0.65 },
  { name:"North Ring Road",         baseLoad:0.58 },
  { name:"South Bypass Expressway", baseLoad:0.42 },
  { name:"Riverside Drive",         baseLoad:0.30 },
];

function getCongestion(road) {
  const h = new Date().getHours();
  const d = new Date().getDay();
  const isWE = d===0||d===6;
  const profile = isWE ? HOUR_PROFILE_WD.map(v=>v*0.6) : HOUR_PROFILE_WD;
  const v = road.baseLoad * profile[h] + Math.sin(road.baseLoad*7.3+h*0.4)*0.03;
  return Math.min(98,Math.max(2,Math.round(v*100)));
}

function buildContext() {
  const h = new Date().getHours();
  const d = new Date().getDay();
  const isWE = d===0||d===6;
  const isMR = h>=7&&h<=9; const isER = h>=17&&h<=19;
  const roadData = ROADS.map(r => ({ ...r, cong: getCongestion(r) }));
  const sorted = [...roadData].sort((a,b)=>b.cong-a.cong);
  const avg = Math.round(roadData.reduce((s,r)=>s+r.cong,0)/roadData.length);
  return { h, d, isWE, isMR, isER, roadData, sorted, avg };
}

function fmtHour(h) {
  if(h===0) return "12 AM"; if(h===12) return "12 PM";
  return h<12?`${h} AM`:`${h-12} PM`;
}

const SUGGESTED = [
  "Why is traffic so high?",
  "Best route right now?",
  "When will congestion reduce?",
  "Which road should I avoid?",
  "How's the weather affecting traffic?",
];

function getResponse(message) {
  const ctx = buildContext();
  const msg = message.toLowerCase();
  const worst = ctx.sorted[0];
  const best = ctx.sorted[ctx.sorted.length - 1];

  const timeCtx = ctx.isMR ? "morning rush hour (7–9 AM)" : ctx.isER ? "evening rush hour (5–7 PM)" : ctx.isWE ? "the weekend" : "off-peak hours";

  if (msg.includes("why") && (msg.includes("high")||msg.includes("traffic")||msg.includes("congestion"))) {
    const level = ctx.avg>=75?"severe":ctx.avg>=50?"high":ctx.avg>=25?"moderate":"light";
    return `🧠 **Traffic Analysis**\n\nCurrent average congestion is **${ctx.avg}%** (${level}). The main reasons are:\n\n1. **Time of day** — It's currently ${fmtHour(ctx.h)}, which is ${timeCtx}.\n2. **${worst.name}** is the worst affected at **${worst.cong}%** congestion.\n3. Historical patterns show ${ctx.isWE?"lower weekend traffic, though recreational trips are increasing":"typical weekday demand with commuter peaks"}.\n\nExpect conditions to ease ${ctx.isMR?"around 10 AM":ctx.isER?"after 8 PM":"in the next 30–60 minutes"}.`;
  }

  if (msg.includes("best route")||msg.includes("recommend")||msg.includes("which route")) {
    return `🟢 **Best Route Recommendation**\n\nBased on real-time analysis:\n\n✅ **${best.name}** — only ${best.cong}% congestion\n⚡ Estimated speed: ${Math.round((1-best.cong/100*0.88)*110+8)} km/h\n\n🚫 Avoid **${worst.name}** (${worst.cong}% congestion) and **${ctx.sorted[1].name}** (${ctx.sorted[1].cong}%).\n\nFor turn-by-turn navigation, visit the **Route Optimization** page.`;
  }

  if (msg.includes("when")||(msg.includes("reduce")||msg.includes("clear")||msg.includes("ease")||msg.includes("better"))) {
    const clearMinutes = ctx.isMR ? 65 : ctx.isER ? 80 : 25;
    const clearTime = new Date(Date.now()+clearMinutes*60000).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    return `⏳ **Congestion Forecast**\n\nCurrent network congestion: **${ctx.avg}%**\n\n• **25% reduction** — in ~${Math.round(clearMinutes*0.35)} min\n• **50% reduction** — in ~${Math.round(clearMinutes*0.65)} min\n• **Full clearance** — around **${clearTime}**\n\n${ctx.isMR?"Rush hour traffic typically clears by 10:00 AM.":ctx.isER?"Evening congestion usually eases after 8:00 PM.":"Current conditions are relatively stable — expect gradual improvement."}`;
  }

  if (msg.includes("avoid")||msg.includes("worst")||msg.includes("bad")) {
    return `⛔ **Roads to Avoid**\n\nTop 3 most congested right now:\n\n1. 🔴 **${ctx.sorted[0].name}** — ${ctx.sorted[0].cong}% congestion\n2. 🟠 **${ctx.sorted[1].name}** — ${ctx.sorted[1].cong}% congestion\n3. 🟡 **${ctx.sorted[2].name}** — ${ctx.sorted[2].cong}% congestion\n\nAlternatively, consider:\n✅ **${best.name}** — only ${best.cong}% congestion and much faster.`;
  }

  if (msg.includes("weather")||(msg.includes("rain")||msg.includes("fog")||msg.includes("flood"))) {
    return `🌦️ **Weather Impact on Traffic**\n\nWeather is a key factor in congestion prediction:\n\n• **Rain** adds 12–22% more congestion\n• **Fog** reduces visibility and adds 18–30 min delays\n• **Flash floods** can cause 45+ min delays on low-lying roads\n• **Clear conditions** have minimal traffic impact\n\nFor weather-aware routing, visit the **Route Optimization** page which integrates live weather data from Open-Meteo.`;
  }

  if (msg.includes("hello")||msg.includes("hi")||msg.includes("hey")) {
    return `👋 **Hello! I'm UrbanMind AI Copilot**\n\nI can help you with:\n• 🚦 Real-time traffic analysis\n• 🗺️ Route recommendations\n• ⏳ Congestion forecasts\n• ⛔ Roads to avoid\n• 🌦️ Weather impact on traffic\n\nNetwork status: **${ctx.avg}% average congestion** (${ctx.isMR?"🔴 Rush hour":ctx.isER?"🔴 Evening rush":ctx.isWE?"🟡 Weekend":"🟢 Off-peak"})\n\nWhat would you like to know?`;
  }

  if (msg.includes("park")) {
    return `🅿️ **Smart Parking**\n\nCheck the **Smart Parking** page for real-time availability across 8 parking locations.\n\nQuick tip: Central Plaza Parking and Tech Hub Parking Tower have EV charging available.`;
  }

  if (msg.includes("emergency")||msg.includes("ambulance")||msg.includes("police")||msg.includes("fire")) {
    return `🚨 **Emergency Vehicle Mode**\n\nFor emergency routing, visit the **Emergency Vehicle** page. It provides:\n• Priority routing for Ambulance, Police, and Fire Services\n• Fastest route with signal clearance\n• Nearby hospital locations\n• Real-time dispatch tracking`;
  }

  if (msg.includes("safe")||msg.includes("safety")||msg.includes("accident")) {
    const safest = [...ROADS].sort((a,b)=>a.baseLoad-b.baseLoad)[0];
    return `🛡️ **Road Safety**\n\nThe safest road in the network right now is **${safest.name}** with a high safety index.\n\nFor detailed safety scores based on accident history, road condition, visibility, and construction, visit the **Road Safety Index** page.\n\nGeneral tip: Avoid **${worst.name}** during ${timeCtx} — it has the highest incident rate.`;
  }

  if (msg.includes("carbon")||msg.includes("emission")||msg.includes("co2")||msg.includes("eco")) {
    return `🌿 **Carbon & Emissions**\n\nDid you know? Taking the eco-friendly route can save up to **2.4 kg CO₂** per trip.\n\nVisit the **Carbon Emission** page to:\n• Compare vehicles by emission\n• Find the greenest route\n• Track your monthly carbon savings\n\nCurrent network emissions: ~2.4 tonnes CO₂/day.`;
  }

  // Generic fallback
  return `🤔 **Here's what I know right now:**\n\nNetwork congestion: **${ctx.avg}%** — ${ctx.avg>=75?"Severe ⛔":ctx.avg>=50?"High ⚠️":ctx.avg>=25?"Moderate 🟡":"Clear 🟢"}\n\nWorst road: **${worst.name}** at ${worst.cong}%\nBest route: **${best.name}** at ${best.cong}%\nTime context: ${timeCtx}\n\nTry asking me:\n• "Why is traffic high?"\n• "Best route right now?"\n• "When will congestion ease?"`;
}

function renderMessage(text) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let last = 0; let m;
    while ((m = boldRegex.exec(line)) !== null) {
      if (m.index > last) parts.push(line.slice(last, m.index));
      parts.push(<strong key={m.index} style={{ color:"white", fontWeight:700 }}>{m[1]}</strong>);
      last = m.index + m[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return <div key={i} style={{ lineHeight:1.6, minHeight: line===''?'8px':undefined }}>{parts}</div>;
  });
}

export default function AICopilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role:"ai", text:"👋 Hi! I'm UrbanMind AI Copilot. Ask me about traffic, routes, congestion, or road safety.", time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) { bottomRef.current?.scrollIntoView({behavior:"smooth"}); inputRef.current?.focus(); }
  }, [open, messages]);

  function send(text) {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput("");
    const userMsg = { role:"user", text:msg, time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);
    setTimeout(() => {
      const aiText = getResponse(msg);
      setMessages(prev => [...prev, { role:"ai", text:aiText, time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) }]);
      setTyping(false);
    }, 700 + Math.random() * 500);
  }

  return (
    <>
      <style>{`
        @keyframes copilotIn{from{opacity:0;transform:scale(0.9) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes pulseBtn{0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,0.4)}50%{box-shadow:0 0 0 10px rgba(139,92,246,0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        .copilot-input::placeholder{color:rgba(255,255,255,0.25)}
        .copilot-input:focus{outline:none;border-color:rgba(139,92,246,0.5)!important}
      `}</style>

      {/* Floating button */}
      <button onClick={()=>setOpen(o=>!o)} style={{
        position:"fixed", bottom:28, right:28, zIndex:9999,
        width:56, height:56, borderRadius:"50%",
        background: open ? "rgba(239,68,68,0.9)" : "linear-gradient(135deg,#8b5cf6,#3b82f6)",
        border:"none", cursor:"pointer", fontSize:22,
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:"0 4px 20px rgba(139,92,246,0.5)",
        animation: !open ? "pulseBtn 2.5s infinite" : "none",
        transition:"background 0.2s, transform 0.2s",
      }} title={open ? "Close AI Copilot" : "Open AI Copilot"}>
        {open ? "✕" : "✨"}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position:"fixed", bottom:96, right:28, zIndex:9998,
          width:380, height:580, display:"flex", flexDirection:"column",
          background:"rgba(10,15,30,0.95)", backdropFilter:"blur(24px)",
          border:"1px solid rgba(139,92,246,0.3)", borderRadius:20,
          boxShadow:"0 20px 60px rgba(0,0,0,0.5)",
          animation:"copilotIn 0.25s ease",
          overflow:"hidden",
        }}>
          {/* Header */}
          <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", gap:10, background:"rgba(139,92,246,0.1)" }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#8b5cf6,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>✨</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:800, color:"white" }}>UrbanMind AI Copilot</div>
              <div style={{ fontSize:11, color:"rgba(139,92,246,0.8)", display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", animation:"blink 2s infinite" }} />
                Live traffic analysis
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 8px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom:14, display:"flex", flexDirection:"column", alignItems: m.role==="user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth:"86%", padding:"10px 14px",
                  background: m.role==="user" ? "linear-gradient(135deg,#8b5cf6,#3b82f6)" : "rgba(255,255,255,0.06)",
                  border: m.role==="ai" ? "1px solid rgba(255,255,255,0.08)" : "none",
                  borderRadius: m.role==="user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.5,
                }}>
                  {renderMessage(m.text)}
                </div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:4, marginLeft:4, marginRight:4 }}>{m.time}</div>
              </div>
            ))}
            {typing && (
              <div style={{ display:"flex", gap:4, padding:"12px 16px", background:"rgba(255,255,255,0.04)", borderRadius:"16px 16px 16px 4px", width:"fit-content", marginBottom:14 }}>
                {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"rgba(139,92,246,0.8)", animation:`blink 1.2s ${i*0.2}s infinite` }} />)}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested questions */}
          {messages.length === 1 && (
            <div style={{ padding:"0 16px 8px", display:"flex", gap:6, flexWrap:"wrap" }}>
              {SUGGESTED.map(q => (
                <button key={q} onClick={()=>send(q)} style={{ padding:"5px 10px", background:"rgba(139,92,246,0.1)", border:"1px solid rgba(139,92,246,0.25)", borderRadius:20, fontSize:11, color:"#c4b5fd", cursor:"pointer", whiteSpace:"nowrap" }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding:"12px 16px", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", gap:8 }}>
            <input
              ref={inputRef}
              className="copilot-input"
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&!typing&&send()}
              placeholder="Ask about traffic, routes, weather…"
              style={{ flex:1, padding:"10px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, fontSize:13, color:"white", outline:"none", fontFamily:"inherit" }}
            />
            <button onClick={()=>!typing&&send()} disabled={typing||!input.trim()} style={{
              width:40, height:40, borderRadius:12, border:"none",
              background: (typing||!input.trim()) ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#8b5cf6,#3b82f6)",
              color:"white", fontSize:16, cursor:(typing||!input.trim())?"not-allowed":"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
            }}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}
