import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const DEMO_ACCOUNTS = [
  { email: "admin@urbanmind.ai",   password: "admin123",   role: "Admin",   icon: "🛡️" },
  { email: "analyst@urbanmind.ai", password: "analyst123", role: "Analyst", icon: "📊" },
  { email: "demo@urbanmind.ai",    password: "demo123",    role: "Viewer",  icon: "👁️" },
];

const FEATURES = [
  { icon: "🧠", label: "Explainable AI" },
  { icon: "🗺️", label: "Route Optimization" },
  { icon: "🏙️", label: "Smart City Analytics" },
  { icon: "🌿", label: "Carbon Emission Tracking" },
  { icon: "🚨", label: "Emergency Vehicle Mode" },
  { icon: "🅿️", label: "Smart Parking" },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [featureIdx, setFeatureIdx] = useState(0);
  const [demoExpanded, setDemoExpanded] = useState(false);

  // Cycle through features
  useEffect(() => {
    const t = setInterval(() => setFeatureIdx(i => (i + 1) % FEATURES.length), 2200);
    return () => clearInterval(t);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/dashboard");
      } else {
        setError(data.message || "Invalid email or password.");
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
    setDemoExpanded(false);
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0f1e; }

        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-30px) scale(1.08)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,25px) scale(1.05)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,40px) scale(1.06)} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes featureFade { 0%{opacity:0;transform:translateY(6px)} 20%,80%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-6px)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }

        .login-input {
          width: 100%;
          padding: 13px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          font-family: inherit;
        }
        .login-input:focus {
          border-color: rgba(139,92,246,0.6);
          background: rgba(139,92,246,0.06);
        }
        .login-input::placeholder { color: rgba(255,255,255,0.28); }
        .login-input.error { border-color: rgba(239,68,68,0.5); animation: shake 0.35s ease; }

        .login-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          font-family: inherit;
          position: relative;
          overflow: hidden;
        }
        .login-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        .login-btn:disabled { cursor: not-allowed; opacity: 0.7; }
        .login-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          background-size: 200% auto;
          animation: shimmer 2.5s linear infinite;
        }

        .demo-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          width: 100%;
          text-align: left;
        }
        .demo-chip:hover {
          background: rgba(139,92,246,0.12);
          border-color: rgba(139,92,246,0.35);
        }

        .eye-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.4);
          padding: 0 4px;
          font-size: 16px;
          line-height: 1;
          transition: color 0.15s;
        }
        .eye-btn:hover { color: rgba(255,255,255,0.75); }
      `}</style>

      <div style={{
        minHeight: "100vh",
        backgroundColor: "#0a0f1e",
        display: "flex",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Animated background orbs */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:"-10%", left:"-5%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)", animation:"float1 12s ease-in-out infinite" }} />
          <div style={{ position:"absolute", bottom:"-10%", right:"-5%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)", animation:"float2 15s ease-in-out infinite" }} />
          <div style={{ position:"absolute", top:"45%", left:"40%", width:350, height:350, borderRadius:"50%", background:"radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)", animation:"float3 18s ease-in-out infinite" }} />
          {/* Grid overlay */}
          <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize:"60px 60px", opacity:0.6 }} />
        </div>

        {/* Left panel — branding */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 64px",
          position: "relative",
          zIndex: 1,
        }} className="left-panel">
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:56 }}>
            <div style={{ width:44, height:44, borderRadius:14, background:"linear-gradient(135deg,#8b5cf6,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, boxShadow:"0 4px 20px rgba(139,92,246,0.4)" }}>✨</div>
            <div>
              <div style={{ fontSize:20, fontWeight:900, color:"white", letterSpacing:"-0.5px" }}>UrbanMind <span style={{ color:"#8b5cf6" }}>AI</span></div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:1 }}>Smart Traffic Intelligence</div>
            </div>
          </div>

          <h1 style={{ fontSize:42, fontWeight:900, color:"white", lineHeight:1.15, marginBottom:20, letterSpacing:"-1px" }}>
            Intelligent Traffic<br />
            <span style={{ background:"linear-gradient(135deg,#8b5cf6,#3b82f6,#06b6d4)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              Command Center
            </span>
          </h1>

          <p style={{ fontSize:16, color:"rgba(255,255,255,0.5)", lineHeight:1.7, marginBottom:48, maxWidth:420 }}>
            AI-powered route optimization, real-time congestion monitoring, and explainable predictions — all in one platform.
          </p>

          {/* Animated feature badge */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:40 }}>
            <div style={{ padding:"10px 18px", background:"rgba(139,92,246,0.12)", border:"1px solid rgba(139,92,246,0.25)", borderRadius:99, display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ animation:"featureFade 2.2s ease-in-out infinite", display:"inline-flex", alignItems:"center", gap:7 }}>
                <span style={{ fontSize:18 }}>{FEATURES[featureIdx].icon}</span>
                <span style={{ fontSize:13, fontWeight:600, color:"#c4b5fd" }}>{FEATURES[featureIdx].label}</span>
              </span>
            </div>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>+ 13 AI modules</span>
          </div>

          {/* Feature grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, maxWidth:420 }}>
            {FEATURES.map((f, i) => (
              <div key={f.label} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10 }}>
                <span style={{ fontSize:16 }}>{f.icon}</span>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)", fontWeight:500 }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — login form */}
        <div style={{
          width: "min(440px, 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          position: "relative",
          zIndex: 1,
        }}>
          <div style={{
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 24,
            backdropFilter: "blur(24px)",
            padding: "40px 36px",
            animation: "fadeSlide 0.5s ease",
            boxShadow: "0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}>
            {/* Form header */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "white", marginBottom: 6 }}>Welcome back</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Sign in to your UrbanMind AI account</div>
            </div>

            {/* Error banner */}
            {error && (
              <div style={{
                padding: "12px 16px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 10,
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 8,
                animation: "fadeSlide 0.3s ease",
              }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span style={{ fontSize: 13, color: "#fca5a5", fontWeight: 500 }}>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {/* Email */}
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.45)", display:"block", marginBottom:7, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className={`login-input${error ? " error" : ""}`}
                  placeholder="you@urbanmind.ai"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {/* Password */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                    Password
                  </label>
                  <Link to="/forgot-password" style={{ fontSize:12, color:"rgba(139,92,246,0.8)", textDecoration:"none" }}
                    onMouseOver={e=>e.target.style.color="#c4b5fd"} onMouseOut={e=>e.target.style.color="rgba(139,92,246,0.8)"}>
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position:"relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    className={`login-input${error ? " error" : ""}`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    autoComplete="current-password"
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)}
                    style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)" }}>
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="login-btn" disabled={loading} style={{ marginTop:4 }}>
                {loading ? (
                  <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    <span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }}/>
                    Signing in…
                  </span>
                ) : "Sign In →"}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display:"flex", alignItems:"center", gap:12, margin:"24px 0 20px" }}>
              <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.07)" }} />
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.25)", whiteSpace:"nowrap" }}>or use a demo account</span>
              <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.07)" }} />
            </div>

            {/* Demo accounts */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {DEMO_ACCOUNTS.map(account => (
                <button key={account.email} type="button" className="demo-chip" onClick={() => fillDemo(account)}>
                  <span style={{ fontSize:18 }}>{account.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.75)" }}>{account.role}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:1 }}>{account.email}</div>
                  </div>
                  <span style={{ fontSize:11, color:"rgba(139,92,246,0.7)", fontWeight:600 }}>Fill →</span>
                </button>
              ))}
            </div>

            {/* Register link */}
            <p style={{ textAlign:"center", fontSize:13, color:"rgba(255,255,255,0.35)", marginTop:28 }}>
              No account yet?{" "}
              <Link to="/register" style={{ color:"#a78bfa", fontWeight:600, textDecoration:"none" }}
                onMouseOver={e=>e.target.style.color="#c4b5fd"} onMouseOut={e=>e.target.style.color="#a78bfa"}>
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Hide left panel on small screens */}
      <style>{`
        @media (max-width: 820px) {
          .left-panel { display: none !important; }
        }
      `}</style>
    </>
  );
}
