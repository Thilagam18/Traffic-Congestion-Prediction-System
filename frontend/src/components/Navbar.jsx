import React from "react";

function Navbar() {
  return (
    <nav
      style={{
        backgroundColor: "#0f172a",
        color: "white",
        padding: "15px 30px",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <h2>Traffic Congestion System</h2>

      <div>
        <span style={{ marginRight: "20px" }}>
          Dashboard
        </span>

        <span style={{ marginRight: "20px" }}>
          Routes
        </span>

        <span>Logout</span>
      </div>
    </nav>
  );
}

export default Navbar;
