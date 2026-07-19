import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const BENEFITS = [
  { icon: "🧠", label: "AI-Powered Predictions" },
  { icon: "🗺️", label: "Smart Route Optimization" },
  { icon: "🏙️", label: "City-Wide Analytics" },
  { icon: "🌿", label: "Carbon Footprint Tracking" },
  { icon: "🚨", label: "Emergency Vehicle Mode" },
  { icon: "🅿️", label: "Intelligent Parking" },
];

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => navigate("/"), 2200);
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
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
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
        @keyframes successPop { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }

        .reg-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          font-family: inherit;
        }
        .reg-input:focus {
          border-color: rgba(139,92,246,0.6);
          background: rgba(139,92,246,0.06);
        }
        .reg-input::placeholder { color: rgba(255,255,255,0.28); }
        .reg-input.error-field { border-color: rgba(239,68,68,0.5); animation: shake 0.35s ease; }

        .reg-btn {
          width: 100%;
          padding: 13px;
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
        .reg-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .reg-btn:active:not(:disabled) { transform: translateY(0); }
        .reg-btn:disabled { cursor: not-allowed; opacity: 0.7; }
        .reg-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          background-size: 200% auto;
          animation: shimmer 2.5s linear infinite;
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
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)", animation: "float1 12s ease-in-out infinite" }} />
          <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)", animation: "float2 15s ease-in-out infinite" }} />
          <div style={{ position: "absolute", top: "45%", left: "40%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)", animation: "float3 18s ease-in-out infinite" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "60px 60px", opacity: 0.6 }} />
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
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 56 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,#8b5cf6,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 4px 20px rgba(139,92,246,0.4)" }}>✨</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "white", letterSpacing: "-0.5px" }}>Traffic <span style={{ color: "#8b5cf6" }}>Prediction</span></div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>Smart Traffic Intelligence</div>
            </div>
          </div>

          <h1 style={{ fontSize: 40, fontWeight: 900, color: "white", lineHeight: 1.15, marginBottom: 18, letterSpacing: "-1px" }}>
            Join the Future of<br />
            <span style={{ background: "linear-gradient(135deg,#8b5cf6,#3b82f6,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Smart Mobility
            </span>
          </h1>

          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 44, maxWidth: 420 }}>
            Access 15+ AI modules for traffic prediction, real-time monitoring, and route optimization. Build smarter cities — starting with your account.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 420 }}>
            {BENEFITS.map((b) => (
              <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
                <span style={{ fontSize: 16 }}>{b.icon}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — register form */}
        <div style={{
          width: "min(460px, 100%)",
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
            padding: "38px 36px",
            animation: "fadeSlide 0.5s ease",
            boxShadow: "0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}>

            {success ? (
              <div style={{ textAlign: "center", animation: "successPop 0.45s ease", padding: "24px 0" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 8 }}>Account Created!</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>Redirecting you to the login page…</div>
                <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.15)", borderTopColor: "#8b5cf6", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 6 }}>Create your account</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Get started with Traffic Prediction — free forever</div>
                </div>

                {error && (
                  <div style={{
                    padding: "11px 16px",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: 10,
                    marginBottom: 18,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    animation: "fadeSlide 0.3s ease",
                  }}>
                    <span style={{ fontSize: 15 }}>⚠️</span>
                    <span style={{ fontSize: 13, color: "#fca5a5", fontWeight: 500 }}>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Name */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Full Name</label>
                    <input
                      type="text"
                      className={`reg-input${error && !name.trim() ? " error-field" : ""}`}
                      placeholder="Jane Smith"
                      value={name}
                      onChange={e => { setName(e.target.value); setError(""); }}
                      autoComplete="name"
                      autoFocus
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email Address</label>
                    <input
                      type="email"
                      className={`reg-input${error && !email.trim() ? " error-field" : ""}`}
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(""); }}
                      autoComplete="email"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPass ? "text" : "password"}
                        className="reg-input"
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(""); }}
                        autoComplete="new-password"
                        style={{ paddingRight: 44 }}
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
                        {showPass ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {password.length > 0 && (
                      <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
                        {[...Array(4)].map((_, i) => (
                          <div key={i} style={{
                            flex: 1, height: 3, borderRadius: 99,
                            background: password.length >= (i + 1) * 2
                              ? (password.length < 6 ? "#f97316" : password.length < 10 ? "#eab308" : "#22c55e")
                              : "rgba(255,255,255,0.1)",
                            transition: "background 0.3s",
                          }} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Confirm Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showConfirm ? "text" : "password"}
                        className={`reg-input${confirmPassword && confirmPassword !== password ? " error-field" : ""}`}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); setError(""); }}
                        autoComplete="new-password"
                        style={{ paddingRight: 44 }}
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowConfirm(v => !v)}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
                        {showConfirm ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== password && (
                      <div style={{ fontSize: 11, color: "#f87171", marginTop: 5 }}>Passwords don't match yet</div>
                    )}
                    {confirmPassword && confirmPassword === password && (
                      <div style={{ fontSize: 11, color: "#4ade80", marginTop: 5 }}>✓ Passwords match</div>
                    )}
                  </div>

                  <button type="submit" className="reg-btn" disabled={loading} style={{ marginTop: 4 }}>
                    {loading ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                        Creating account…
                      </span>
                    ) : "Create Account →"}
                  </button>
                </form>

                <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 24 }}>
                  Already have an account?{" "}
                  <Link to="/" style={{ color: "#a78bfa", fontWeight: 600, textDecoration: "none" }}
                    onMouseOver={e => e.target.style.color = "#c4b5fd"}
                    onMouseOut={e => e.target.style.color = "#a78bfa"}>
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .left-panel { display: none !important; }
        }
      `}</style>
    </>
  );
}
