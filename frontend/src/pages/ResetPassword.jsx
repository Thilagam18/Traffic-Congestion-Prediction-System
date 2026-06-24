import React, { useState, useEffect } from "react";

function ResetPassword() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!token) {
      alert("Reset token is missing. Please use the link from the forgot password page.");
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
      } else {
        alert(data.message || "Failed to reset password");
      }
    } catch (err) {
      alert("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
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
      <div
        style={{
          width: "420px",
          padding: "30px",
          backgroundColor: "white",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "8px" }}>Reset Password</h2>

        {done ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "6px",
                padding: "20px",
                marginBottom: "20px",
              }}
            >
              <p style={{ color: "#166534", fontWeight: "600", margin: "0 0 6px" }}>
                Password reset successfully!
              </p>
              <p style={{ color: "#166534", margin: 0, fontSize: "14px" }}>
                You can now log in with your new password.
              </p>
            </div>
            <a
              href="/"
              style={{
                display: "block",
                padding: "10px",
                backgroundColor: "#2563eb",
                color: "white",
                borderRadius: "4px",
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              Go to Login
            </a>
          </div>
        ) : (
          <>
            <p style={{ textAlign: "center", color: "#6b7280", marginBottom: "24px", fontSize: "14px" }}>
              Enter your new password below.
            </p>

            {!token && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "6px",
                  padding: "12px",
                  marginBottom: "16px",
                  fontSize: "14px",
                  color: "#991b1b",
                }}
              >
                No reset token found. Please use the link from the forgot password page.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  boxSizing: "border-box",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                }}
              />

              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                disabled={loading || !token}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: loading || !token ? "#93c5fd" : "#2563eb",
                  color: "white",
                  border: "none",
                  cursor: loading || !token ? "not-allowed" : "pointer",
                  borderRadius: "4px",
                }}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px" }}>
              <a href="/" style={{ color: "#2563eb" }}>
                Back to Login
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
