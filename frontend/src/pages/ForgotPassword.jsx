import React, { useState } from "react";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      alert("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success && data.token) {
        const link = `${window.location.origin}/reset-password?token=${data.token}`;
        setResetLink(link);
      } else if (data.success) {
        setResetLink("__not_found__");
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (err) {
      alert("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cardStyle = {
    width: "460px",
    padding: "30px",
    backgroundColor: "white",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.2)",
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f4f4f4",
        padding: "20px",
      }}
    >
      <div style={cardStyle}>
        <h2 style={{ textAlign: "center", marginBottom: "8px" }}>Forgot Password</h2>
        <p style={{ textAlign: "center", color: "#6b7280", marginBottom: "24px", fontSize: "14px" }}>
          Enter your email and we'll generate a reset link for you.
        </p>

        {!resetLink && (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "15px",
                boxSizing: "border-box",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: loading ? "#93c5fd" : "#2563eb",
                color: "white",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                borderRadius: "4px",
              }}
            >
              {loading ? "Generating link..." : "Generate Reset Link"}
            </button>
          </form>
        )}

        {resetLink === "__not_found__" && (
          <div
            style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "6px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#166534", margin: 0 }}>
              If that email is registered, a reset link has been sent.
            </p>
          </div>
        )}

        {resetLink && resetLink !== "__not_found__" && (
          <div>
            <div
              style={{
                backgroundColor: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "6px",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <p style={{ margin: "0 0 10px", color: "#1e40af", fontWeight: "600", fontSize: "14px" }}>
                Reset link generated (valid for 1 hour):
              </p>
              <p
                style={{
                  wordBreak: "break-all",
                  fontSize: "13px",
                  color: "#1d4ed8",
                  margin: "0 0 12px",
                  background: "white",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #bfdbfe",
                }}
              >
                {resetLink}
              </p>
              <button
                onClick={handleCopy}
                style={{
                  width: "100%",
                  padding: "8px",
                  backgroundColor: copied ? "#16a34a" : "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center" }}>
              Open the link above to set your new password.
            </p>
          </div>
        )}

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px" }}>
          <a href="/" style={{ color: "#2563eb" }}>
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
