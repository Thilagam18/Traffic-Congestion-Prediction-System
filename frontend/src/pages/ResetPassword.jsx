import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
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
    if (!token) {
      setError("Reset token is missing. Please use the link from the forgot password page.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        setTimeout(() => navigate("/"), 3000);
      } else {
        setError(data.message || "Failed to reset password. The link may have expired.");
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
        @keyframes fadeSlide { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
        @keyframes successPop { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }

        .rp-input {
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
        .rp-input:focus {
          border-color: rgba(139,92,246,0.6);
          background: rgba(139,92,246,0.06);
        }
        .rp-input::placeholder { color: rgba(255,255,255,0.28); }
        .rp-input.error-field { border-color: rgba(239,68,68,0.5); animation: shake 0.35s ease; }
        .rp-input:disabled { opacity: 0.4; cursor: not-allowed; }

        .rp-btn {
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
        .rp-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .rp-btn:active:not(:disabled) { transform: translateY(0); }
        .rp-btn:disabled { cursor: not-allowed; opacity: 0.7; }
        .rp-btn::after {
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
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background orbs */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)", animation: "float1 12s ease-in-out infinite" }} />
          <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)", animation: "float2 15s ease-in-out infinite" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "60px 60px", opacity: 0.5 }} />
        </div>

        <div style={{
          width: "100%",
          maxWidth: 440,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 24,
          backdropFilter: "blur(24px)",
          padding: "40px 36px",
          animation: "fadeSlide 0.5s ease",
          boxShadow: "0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
          position: "relative",
          zIndex: 1,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#8b5cf6,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 4px 16px rgba(139,92,246,0.4)" }}>✨</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "white" }}>Traffic <span style={{ color: "#8b5cf6" }}>Prediction</span></div>
          </div>

          {done ? (
            <div style={{ textAlign: "center", animation: "successPop 0.45s ease", padding: "16px 0" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🔓</div>
              <div style={{ fontSize: 21, fontWeight: 800, color: "white", marginBottom: 8 }}>Password Reset!</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 28, lineHeight: 1.6 }}>
                Your password has been updated successfully.<br />Redirecting to login…
              </div>
              <Link
                to="/"
                style={{
                  display: "inline-block",
                  padding: "12px 28px",
                  background: "linear-gradient(135deg,#8b5cf6,#3b82f6)",
                  color: "white",
                  borderRadius: 12,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Go to Login →
              </Link>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 6 }}>Set new password</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Choose a strong password for your account.</div>
              </div>

              {/* Missing token warning */}
              {!token && (
                <div style={{
                  padding: "12px 16px",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 10,
                  marginBottom: 18,
                  fontSize: 13,
                  color: "#fca5a5",
                }}>
                  ⚠️ No reset token found. Please use the link from the forgot password page.
                </div>
              )}

              {/* Error */}
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
                  <span>⚠️</span>
                  <span style={{ fontSize: 13, color: "#fca5a5", fontWeight: 500 }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPass ? "text" : "password"}
                      className={`rp-input${error ? " error-field" : ""}`}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(""); }}
                      disabled={!token}
                      autoComplete="new-password"
                      autoFocus
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

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Confirm New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirm ? "text" : "password"}
                      className={`rp-input${confirmPassword && confirmPassword !== password ? " error-field" : ""}`}
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError(""); }}
                      disabled={!token}
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

                <button type="submit" className="rp-btn" disabled={loading || !token} style={{ marginTop: 4 }}>
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                      Resetting…
                    </span>
                  ) : "Reset Password →"}
                </button>
              </form>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24 }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                <Link to="/forgot-password" style={{ fontSize: 13, color: "rgba(139,92,246,0.8)", textDecoration: "none", whiteSpace: "nowrap" }}
                  onMouseOver={e => e.target.style.color = "#c4b5fd"}
                  onMouseOut={e => e.target.style.color = "rgba(139,92,246,0.8)"}>
                  ← Request new link
                </Link>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
