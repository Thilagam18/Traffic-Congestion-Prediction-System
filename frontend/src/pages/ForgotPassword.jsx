import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        const link = `${window.location.origin}/reset-password?token=${data.token}`;
        setResetLink(link);
      } else if (data.success) {
        setNotFound(true);
      } else {
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        .fp-input {
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
        .fp-input:focus {
          border-color: rgba(139,92,246,0.6);
          background: rgba(139,92,246,0.06);
        }
        .fp-input::placeholder { color: rgba(255,255,255,0.28); }
        .fp-input.error-field { border-color: rgba(239,68,68,0.5); animation: shake 0.35s ease; }

        .fp-btn {
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
        .fp-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .fp-btn:active:not(:disabled) { transform: translateY(0); }
        .fp-btn:disabled { cursor: not-allowed; opacity: 0.7; }
        .fp-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          background-size: 200% auto;
          animation: shimmer 2.5s linear infinite;
        }
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

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 6 }}>Forgot your password?</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
              Enter your email and we'll generate a secure reset link.
            </div>
          </div>

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

          {/* Not found notice */}
          {notFound && (
            <div style={{
              padding: "16px",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: 12,
              marginBottom: 20,
              animation: "fadeSlide 0.3s ease",
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#6ee7b7", marginBottom: 4 }}>✓ Check your email</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>If that address is registered, a reset link has been sent.</div>
            </div>
          )}

          {/* Reset link display */}
          {resetLink && (
            <div style={{
              padding: "16px",
              background: "rgba(139,92,246,0.08)",
              border: "1px solid rgba(139,92,246,0.25)",
              borderRadius: 12,
              marginBottom: 20,
              animation: "fadeSlide 0.3s ease",
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#c4b5fd", marginBottom: 10 }}>🔑 Reset link generated (valid 1 hour):</div>
              <div style={{
                wordBreak: "break-all",
                fontSize: 12,
                color: "rgba(255,255,255,0.6)",
                background: "rgba(0,0,0,0.3)",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.08)",
                marginBottom: 12,
                fontFamily: "monospace",
              }}>
                {resetLink}
              </div>
              <button
                onClick={handleCopy}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: copied ? "rgba(34,197,94,0.2)" : "rgba(139,92,246,0.2)",
                  border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : "rgba(139,92,246,0.4)"}`,
                  color: copied ? "#4ade80" : "#c4b5fd",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "all 0.2s",
                  fontFamily: "inherit",
                }}
              >
                {copied ? "✓ Copied to clipboard!" : "📋 Copy Reset Link"}
              </button>
            </div>
          )}

          {/* Form — hide after success */}
          {!resetLink && !notFound && (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className={`fp-input${error ? " error-field" : ""}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <button type="submit" className="fp-btn" disabled={loading}>
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                    Generating link…
                  </span>
                ) : "Send Reset Link →"}
              </button>
            </form>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            <Link to="/" style={{ fontSize: 13, color: "rgba(139,92,246,0.8)", textDecoration: "none", whiteSpace: "nowrap" }}
              onMouseOver={e => e.target.style.color = "#c4b5fd"}
              onMouseOut={e => e.target.style.color = "rgba(139,92,246,0.8)"}>
              ← Back to Login
            </Link>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          </div>
        </div>
      </div>
    </>
  );
}
