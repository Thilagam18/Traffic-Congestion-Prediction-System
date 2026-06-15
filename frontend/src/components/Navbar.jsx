import React from "react";
import { Link } from "react-router-dom";

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
      <h2>Traffic System</h2>

      <div>
        <Link
          to="/dashboard"
          style={{
            color: "white",
            marginRight: "20px",
            textDecoration: "none",
          }}
        >
          Dashboard
        </Link>

        <Link
          to="/route"
          style={{
            color: "white",
            marginRight: "20px",
            textDecoration: "none",
          }}
        >
          Routes
        </Link>

        <Link
          to="/"
          style={{
            color: "white",
            textDecoration: "none",
          }}
        >
          Logout
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
