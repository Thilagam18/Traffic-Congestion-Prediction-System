import React, { useState, useEffect } from "react";

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  const isOk = type === "success";
  return (
    <div style={{
      position: "fixed", top: 72, right: 24, zIndex: 9999,
      display: "flex", alignItems: "center", gap: 10,
      padding: "13px 18px", borderRadius: 10,
      background: isOk ? "#f0fdf4" : "#fef2f2",
      border: `1px solid ${isOk ? "#86efac" : "#fca5a5"}`,
      boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
      fontSize: 14, color: isOk ? "#15803d" : "#dc2626", fontWeight: 600,
      minWidth: 260, maxWidth: 380,
    }}>
      <span style={{ fontSize: 18 }}>{isOk ? "✅" : "❌"}</span>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "rgba(255,255,255,0.4)" }}>✕</button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const INPUT = {
  width: "100%", padding: "10px 14px", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, fontSize: 14, boxSizing: "border-box",
  outline: "none", transition: "border 0.2s",
};

export default function UserProfile() {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = storedUser.id;

  // Profile state
  const [profile, setProfile] = useState({ name: storedUser.name || "", email: storedUser.email || "", created_at: null });
  const [editName, setEditName]   = useState(storedUser.name || "");
  const [editEmail, setEditEmail] = useState(storedUser.email || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [fetchDone, setFetchDone] = useState(false);

  // Password state
  const [curPwd, setCurPwd]     = useState("");
  const [newPwd, setNewPwd]     = useState("");
  const [confPwd, setConfPwd]   = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState({ msg: "", type: "" });
  function showToast(msg, type = "success") { setToast({ msg, type }); }
  function hideToast() { setToast({ msg: "", type: "" }); }

  // Load real profile from DB
  useEffect(() => {
    if (!userId) { setFetchDone(true); return; }
    fetch(`/api/profile/${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const u = data.user;
          setProfile(u);
          setEditName(u.name);
          setEditEmail(u.email);
        }
      })
      .catch(() => {})
      .finally(() => setFetchDone(true));
  }, [userId]);

  const isDirty = editName !== profile.name || editEmail !== profile.email;

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
      showToast("Name and email are required.", "error"); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) {
      showToast("Please enter a valid email address.", "error"); return;
    }
    if (!userId) {
      showToast("No user session found. Please log in again.", "error"); return;
    }
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/profile/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), email: editEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.user);
        localStorage.setItem("user", JSON.stringify({ ...storedUser, name: data.user.name, email: data.user.email }));
        showToast("Profile updated successfully!");
      } else {
        showToast(data.message || "Update failed.", "error");
      }
    } catch {
      showToast("Could not reach server.", "error");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (!curPwd || !newPwd || !confPwd) {
      showToast("All password fields are required.", "error"); return;
    }
    if (newPwd.length < 6) {
      showToast("New password must be at least 6 characters.", "error"); return;
    }
    if (newPwd !== confPwd) {
      showToast("New passwords do not match.", "error"); return;
    }
    if (newPwd === curPwd) {
      showToast("New password must be different from current.", "error"); return;
    }
    if (!userId) {
      showToast("No user session found. Please log in again.", "error"); return;
    }
    setPwdLoading(true);
    try {
      const res = await fetch(`/api/change-password/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Password changed successfully!");
        setCurPwd(""); setNewPwd(""); setConfPwd("");
      } else {
        showToast(data.message || "Password change failed.", "error");
      }
    } catch {
      showToast("Could not reach server.", "error");
    } finally {
      setPwdLoading(false);
    }
  }

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })
    : "—";

  const pwdStrength = (() => {
    if (!newPwd) return null;
    let score = 0;
    if (newPwd.length >= 8) score++;
    if (/[A-Z]/.test(newPwd)) score++;
    if (/[0-9]/.test(newPwd)) score++;
    if (/[^A-Za-z0-9]/.test(newPwd)) score++;
    const labels = ["Weak", "Fair", "Good", "Strong"];
    const colors = ["#ef4444", "#f97316", "#f59e0b", "#16a34a"];
    return { score, label: labels[Math.min(score - 1, 3)] || "Weak", color: colors[Math.min(score - 1, 3)] || "#ef4444" };
  })();

  return (
    <>
      
      <Toast msg={toast.msg} type={toast.type} onClose={hideToast} />

      <div style={{ padding: "28px 32px", backgroundColor: "#080d1a", minHeight: "100vh" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, color: "white" }}>My Profile</h1>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            Manage your account information and security settings
          </p>
        </div>

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>

          {/* ── Left: Avatar card ── */}
          <div style={{ width: 260, flexShrink: 0 }}>

            {/* Avatar */}
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "28px 24px", textAlign: "center", marginBottom: 16 }}>
              <div style={{
                width: 88, height: 88, borderRadius: "50%",
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 30, fontWeight: 800, color: "white",
                margin: "0 auto 16px",
                boxShadow: "0 4px 16px rgba(37,99,235,0.3)",
              }}>
                {initials(profile.name)}
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "white" }}>{profile.name || "—"}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{profile.email || "—"}</div>
              <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", background: "rgba(37,99,235,0.2)", borderRadius: 99 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#93c5fd" }}>Traffic Administrator</span>
              </div>
            </div>

            {/* Account stats */}
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 14 }}>Account Details</div>
              {[
                { icon: "🆔", label: "User ID",      value: userId ? `#${userId}` : "Not logged in" },
                { icon: "📅", label: "Member since", value: memberSince },
                { icon: "🔐", label: "Auth method",  value: "Password" },
                { icon: "✅", label: "Status",       value: <span style={{ color: "#16a34a", fontWeight: 700 }}>Active</span> },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>{icon} {label}</span>
                  <span style={{ color: "rgba(255,255,255,0.75)", fontWeight: 600, textAlign: "right" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Edit forms ── */}
          <div style={{ flex: 1, minWidth: 300, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Profile info form */}
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.04)" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>👤 Personal Information</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                  {userId ? "Changes are saved to the database" : "⚠️ Log in to save changes to your account"}
                </div>
              </div>
              <form onSubmit={handleSaveProfile} style={{ padding: "24px" }}>
                <Field label="Full Name">
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Your full name"
                    style={INPUT}
                    onFocus={e => e.target.style.borderColor = "#2563eb"}
                    onBlur={e => e.target.style.borderColor = "#d1d5db"}
                  />
                </Field>
                <Field label="Email Address">
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    placeholder="your@email.com"
                    style={INPUT}
                    onFocus={e => e.target.style.borderColor = "#2563eb"}
                    onBlur={e => e.target.style.borderColor = "#d1d5db"}
                  />
                </Field>
                <Field label="Role">
                  <div style={{ ...INPUT, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)", cursor: "not-allowed" }}>
                    Traffic Administrator
                  </div>
                </Field>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
                  <button
                    type="submit"
                    disabled={profileLoading || !isDirty}
                    style={{
                      padding: "10px 24px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: profileLoading || !isDirty ? "not-allowed" : "pointer",
                      background: profileLoading || !isDirty ? "rgba(255,255,255,0.08)" : "#2563eb",
                      color: profileLoading || !isDirty ? "rgba(255,255,255,0.3)" : "white",
                    }}>
                    {profileLoading ? "Saving…" : "Save Changes"}
                  </button>
                  {isDirty && (
                    <button type="button" onClick={() => { setEditName(profile.name); setEditEmail(profile.email); }}
                      style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", fontSize: 13, color: "rgba(255,255,255,0.45)", cursor: "pointer", fontWeight: 600 }}>
                      Discard
                    </button>
                  )}
                  {isDirty && <span style={{ fontSize: 12, color: "#fbbf24" }}>● Unsaved changes</span>}
                </div>
              </form>
            </div>

            {/* Change password form */}
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.04)" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>🔒 Change Password</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Choose a strong password with at least 6 characters</div>
              </div>
              <form onSubmit={handleChangePassword} style={{ padding: "24px" }}>
                <Field label="Current Password">
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPwd ? "text" : "password"}
                      value={curPwd}
                      onChange={e => setCurPwd(e.target.value)}
                      placeholder="Enter current password"
                      style={{ ...INPUT, paddingRight: 44 }}
                      onFocus={e => e.target.style.borderColor = "#2563eb"}
                      onBlur={e => e.target.style.borderColor = "#d1d5db"}
                    />
                    <button type="button" onClick={() => setShowPwd(s => !s)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 16 }}>
                      {showPwd ? "🙈" : "👁️"}
                    </button>
                  </div>
                </Field>
                <Field label="New Password">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    placeholder="Enter new password"
                    style={INPUT}
                    onFocus={e => e.target.style.borderColor = "#2563eb"}
                    onBlur={e => e.target.style.borderColor = "#d1d5db"}
                  />
                  {pwdStrength && (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", gap: 3 }}>
                        {[1,2,3,4].map(i => (
                          <div key={i} style={{ width: 36, height: 4, borderRadius: 99, background: i <= pwdStrength.score ? pwdStrength.color : "#e5e7eb" }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: pwdStrength.color }}>{pwdStrength.label}</span>
                    </div>
                  )}
                </Field>
                <Field label="Confirm New Password">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={confPwd}
                    onChange={e => setConfPwd(e.target.value)}
                    placeholder="Repeat new password"
                    style={{ ...INPUT, borderColor: confPwd && confPwd !== newPwd ? "#ef4444" : "#d1d5db" }}
                    onFocus={e => e.target.style.borderColor = confPwd && confPwd !== newPwd ? "#ef4444" : "#2563eb"}
                    onBlur={e => e.target.style.borderColor = confPwd && confPwd !== newPwd ? "#ef4444" : "#d1d5db"}
                  />
                  {confPwd && confPwd !== newPwd && (
                    <div style={{ fontSize: 12, color: "#ef4444", marginTop: 5 }}>⚠️ Passwords don't match</div>
                  )}
                  {confPwd && confPwd === newPwd && (
                    <div style={{ fontSize: 12, color: "#16a34a", marginTop: 5 }}>✅ Passwords match</div>
                  )}
                </Field>
                <button
                  type="submit"
                  disabled={pwdLoading || !curPwd || !newPwd || !confPwd}
                  style={{
                    padding: "10px 24px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700,
                    cursor: pwdLoading || !curPwd || !newPwd || !confPwd ? "not-allowed" : "pointer",
                    background: pwdLoading || !curPwd || !newPwd || !confPwd ? "rgba(255,255,255,0.08)" : "#1e40af",
                    color: pwdLoading || !curPwd || !newPwd || !confPwd ? "rgba(255,255,255,0.3)" : "white",
                  }}>
                  {pwdLoading ? "Updating…" : "Update Password"}
                </button>
              </form>
            </div>

            {/* Danger zone */}
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 16, padding: "18px 24px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#dc2626", marginBottom: 6 }}>⚠️ Session</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 14 }}>
                Logging out will clear your session. You'll need to sign in again to access the system.
              </div>
              <button
                onClick={() => { localStorage.removeItem("user"); window.location.href = "/"; }}
                style={{ padding: "9px 20px", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, color: "#dc2626", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                🚪 Log Out
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
