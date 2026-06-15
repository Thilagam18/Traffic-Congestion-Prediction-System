import React, { useState } from "react";
import Navbar from "../components/Navbar";

function RouteOptimization() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [route, setRoute] = useState("");

  const handleRoute = () => {
    if (!source || !destination) {
      alert("Please enter source and destination");
      return;
    }

    setRoute(
      `Best Route: ${source} → Ring Road → Highway → ${destination}`
    );
  };

  return (
    <>
      <Navbar />

      <div style={{ padding: "30px" }}>
        <h2>Route Optimization</h2>

        <input
          type="text"
          placeholder="Enter Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          style={{
            width: "300px",
            padding: "10px",
            marginBottom: "15px",
          }}
        />

        <br />

        <input
          type="text"
          placeholder="Enter Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          style={{
            width: "300px",
            padding: "10px",
            marginBottom: "15px",
          }}
        />

        <br />

        <button
          onClick={handleRoute}
          style={{
            padding: "10px 20px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
          }}
        >
          Find Route
        </button>

        {route && (
          <div
            style={{
              marginTop: "20px",
              backgroundColor: "#f8fafc",
              padding: "15px",
              borderRadius: "10px",
            }}
          >
            <h3>{route}</h3>
          </div>
        )}
      </div>
    </>
  );
}

export default RouteOptimization;
