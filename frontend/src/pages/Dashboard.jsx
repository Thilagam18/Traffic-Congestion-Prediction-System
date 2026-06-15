import React from "react";
import Navbar from "../components/Navbar";

function Dashboard() {
  const cardStyle = {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    width: "220px",
    textAlign: "center",
    boxShadow:
      "0 0 10px rgba(0,0,0,0.1)",
  };

  return (
    <>
      <Navbar />

      <div
        style={{
          padding: "30px",
          backgroundColor: "#f8fafc",
          minHeight: "100vh",
        }}
      >
        <h1>
          Traffic Monitoring Dashboard
        </h1>

        <div
          style={{
            display: "flex",
            gap: "20px",
            marginTop: "30px",
            flexWrap: "wrap",
          }}
        >
          <div style={cardStyle}>
            <h3>Total Roads</h3>
            <h1>120</h1>
          </div>

          <div style={cardStyle}>
            <h3>Congested Roads</h3>
            <h1>18</h1>
          </div>

          <div style={cardStyle}>
            <h3>Optimized Routes</h3>
            <h1>35</h1>
          </div>

          <div style={cardStyle}>
            <h3>Active Alerts</h3>
            <h1>6</h1>
          </div>
        </div>

        <div
          style={{
            marginTop: "40px",
            backgroundColor: "white",
            padding: "25px",
            borderRadius: "10px",
          }}
        >
          <h2>Project Overview</h2>

          <p>
            Traffic congestion prediction and
            route optimization system helps
            monitor road conditions and
            suggest alternative routes to
            reduce travel time.
          </p>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
