const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 5000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3)",
      [name, email, hashed]
    );

    res.json({ success: true, message: "Registration successful" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Demo accounts that work without a database connection
const DEMO_ACCOUNTS = [
  { id: 1, name: "Admin User",      email: "admin@urbanmind.ai", password: "admin123",  role: "admin"    },
  { id: 2, name: "Traffic Analyst", email: "analyst@urbanmind.ai",password: "analyst123",role: "analyst"  },
  { id: 3, name: "Demo User",       email: "demo@urbanmind.ai",  password: "demo123",   role: "viewer"   },
];

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  // Check demo accounts first (works without DB)
  const demo = DEMO_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
  );
  if (demo) {
    return res.json({
      success: true,
      message: "Login successful",
      user: { id: demo.id, name: demo.name, email: demo.email, role: demo.role },
    });
  }

  // Attempt real DB login
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(401).json({ success: false, message: "Invalid email or password" });
  }
});

app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  // Demo accounts: return a simulated token without touching DB
  const demoMatch = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (demoMatch) {
    const token = "demo-" + crypto.randomBytes(24).toString("hex");
    return res.json({ success: true, token, message: "Reset token generated." });
  }

  try {
    const result = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.json({ success: true, message: "If that email exists, a reset link has been generated." });
    }

    const userId = result.rows[0].id;
    const token = crypto.randomBytes(48).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query(
      "DELETE FROM password_reset_tokens WHERE user_id = $1",
      [userId]
    );

    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [userId, token, expiresAt]
    );

    res.json({ success: true, token, message: "Reset token generated." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ success: false, message: "Token and new password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM password_reset_tokens WHERE token = $1 AND used = FALSE AND expires_at > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset link" });
    }

    const { id: tokenId, user_id } = result.rows[0];
    const hashed = await bcrypt.hash(password, 10);

    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashed, user_id]);
    await pool.query("UPDATE password_reset_tokens SET used = TRUE WHERE id = $1", [tokenId]);

    res.json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/profile/:id", async (req, res) => {
  const { id } = req.params;
  // Serve demo accounts without a DB round-trip
  const demo = DEMO_ACCOUNTS.find((a) => a.id === parseInt(id, 10));
  if (demo) {
    return res.json({ success: true, user: { id: demo.id, name: demo.name, email: demo.email, role: demo.role, created_at: new Date().toISOString() } });
  }
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.put("/api/profile/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: "Name and email are required" });
  }
  try {
    const conflict = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email, id]
    );
    if (conflict.rows.length > 0) {
      return res.status(409).json({ success: false, message: "Email already in use by another account" });
    }
    const result = await pool.query(
      "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, created_at",
      [name, email, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "Profile updated successfully", user: result.rows[0] });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.put("/api/change-password/:id", async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Both passwords are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
  }
  try {
    const result = await pool.query("SELECT password FROM users WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const match = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashed, id]);
    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ── Dashboard stats ──────────────────────────────────────────────────────────

app.get("/api/stats", (req, res) => {
  const roads = trafficData;
  const avgCong = roads.length ? Math.round(roads.reduce((s, r) => s + r.congestionLevel, 0) / roads.length) : 0;
  const totalVeh = roads.reduce((s, r) => s + r.vehicles, 0);
  const avgSpeed = roads.length ? Math.round(roads.reduce((s, r) => s + r.avgSpeed, 0) / roads.length) : 0;
  const severeRoads = roads.filter(r => r.congestionLevel >= 75).length;
  res.json({
    success: true,
    stats: { totalRoads: roads.length, avgCongestion: avgCong, totalVehicles: totalVeh, avgSpeed, severeRoads }
  });
});

// ── Notifications (in-memory) ─────────────────────────────────────────────────
let notifications = [
  { id: 1, type: "alert", severity: "High", title: "High Congestion Detected", message: "Market District Road is at 88% congestion.", road: "Market District Road", read: false, createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 2, type: "info",  severity: "Low",  title: "Route Optimized",          message: "Alternative route via South Bypass is recommended.", road: "South Bypass Expressway", read: false, createdAt: new Date(Date.now() - 12 * 60000).toISOString() },
  { id: 3, type: "alert", severity: "Medium", title: "Incident Reported",      message: "Road debris reported on East Highway I-42.", road: "East Highway I-42", read: true,  createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: 4, type: "info",  severity: "Low",  title: "System Update",             message: "Traffic sensors refreshed. All 20 roads are active.", road: null, read: true, createdAt: new Date(Date.now() - 60 * 60000).toISOString() },
];
let nextNotifId = 5;

app.get("/api/notifications", (req, res) => {
  res.json({ success: true, notifications, unreadCount: notifications.filter(n => !n.read).length });
});

app.put("/api/notifications/:id/read", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const n = notifications.find(n => n.id === id);
  if (n) n.read = true;
  res.json({ success: true });
});

app.put("/api/notifications/read-all", (req, res) => {
  notifications.forEach(n => n.read = true);
  res.json({ success: true });
});

app.post("/api/notifications", (req, res) => {
  const { type, severity, title, message, road } = req.body;
  const n = { id: nextNotifId++, type, severity, title, message, road: road || null, read: false, createdAt: new Date().toISOString() };
  notifications = [n, ...notifications].slice(0, 50);
  res.status(201).json({ success: true, notification: n });
});

// ── Route history (in-memory, per session) ────────────────────────────────────
let routeHistory = [];
let nextRouteId = 1;

app.get("/api/route-history", (req, res) => {
  res.json({ success: true, routes: routeHistory.slice(0, 20) });
});

app.post("/api/route-history", (req, res) => {
  const { source, destination, distanceKm, durationMin, trafficLevel } = req.body;
  const entry = { id: nextRouteId++, source, destination, distanceKm, durationMin, trafficLevel, createdAt: new Date().toISOString() };
  routeHistory = [entry, ...routeHistory].slice(0, 20);
  res.status(201).json({ success: true, route: entry });
});

app.delete("/api/route-history/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  routeHistory = routeHistory.filter(r => r.id !== id);
  res.json({ success: true });
});

// ── Favorite routes (in-memory) ───────────────────────────────────────────────
let favoriteRoutes = [];
let nextFavId = 1;

app.get("/api/favorites", (req, res) => {
  res.json({ success: true, favorites: favoriteRoutes });
});

app.post("/api/favorites", (req, res) => {
  const { source, destination, label } = req.body;
  if (favoriteRoutes.find(f => f.source === source && f.destination === destination)) {
    return res.status(409).json({ success: false, message: "Already in favorites." });
  }
  const f = { id: nextFavId++, source, destination, label: label || `${source} → ${destination}`, createdAt: new Date().toISOString() };
  favoriteRoutes.push(f);
  res.status(201).json({ success: true, favorite: f });
});

app.delete("/api/favorites/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  favoriteRoutes = favoriteRoutes.filter(f => f.id !== id);
  res.json({ success: true });
});

// ── Traffic data routes ──────────────────────────────────────────────────────

// In-memory store (persists for the lifetime of the process)
let trafficData = [
  { id: 1, road: "Main Road",       vehicles: 120, avgSpeed: 45, status: "Moderate", congestionLevel: 62 },
  { id: 2, road: "Highway Road",    vehicles: 200, avgSpeed: 80, status: "Heavy",    congestionLevel: 88 },
  { id: 3, road: "City Road",       vehicles: 150, avgSpeed: 35, status: "Moderate", congestionLevel: 71 },
  { id: 4, road: "Ring Road",       vehicles: 180, avgSpeed: 55, status: "Heavy",    congestionLevel: 82 },
  { id: 5, road: "Express Way",     vehicles: 95,  avgSpeed: 90, status: "Light",    congestionLevel: 38 },
  { id: 6, road: "North Connector", vehicles: 135, avgSpeed: 42, status: "Moderate", congestionLevel: 67 },
];
let nextTrafficId = 7;

app.get("/api/traffic", (req, res) => {
  res.json({ success: true, data: trafficData, total: trafficData.length });
});

app.post("/api/traffic", (req, res) => {
  const { road, vehicles, avgSpeed, status, congestionLevel } = req.body;
  if (!road) {
    return res.status(400).json({ success: false, message: "Road name is required" });
  }
  const record = {
    id: nextTrafficId++,
    road,
    vehicles: vehicles ?? 0,
    avgSpeed: avgSpeed ?? 0,
    status: status ?? "Light",
    congestionLevel: congestionLevel ?? 0,
  };
  trafficData.push(record);
  res.status(201).json({ success: true, data: record });
});

app.delete("/api/traffic/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = trafficData.findIndex((r) => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: "Record not found" });
  }
  const removed = trafficData.splice(idx, 1)[0];
  res.json({ success: true, data: removed });
});

// ── Admin user list ──────────────────────────────────────────────────────────

app.get("/api/users", async (req, res) => {
  // Return demo accounts; supplement with DB users if available
  const demoList = DEMO_ACCOUNTS.map(({ id, name, email, role }) => ({ id, name, email, role, source: "demo" }));
  try {
    const result = await pool.query("SELECT id, name, email, created_at FROM users ORDER BY id");
    const dbList = result.rows.map((u) => ({ ...u, role: "user", source: "db" }));
    return res.json({ success: true, users: [...demoList, ...dbList] });
  } catch {
    // DB not available — return demo accounts only
    return res.json({ success: true, users: demoList });
  }
});

// ── Health ───────────────────────────────────────────────────────────────────

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const buildPath = path.join(__dirname, "../frontend/build");
app.use(express.static(buildPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
