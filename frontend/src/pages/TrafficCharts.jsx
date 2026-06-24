import React from "react";
import Navbar from "../components/Navbar";

function TrafficCharts() {
  const roads = [
    {
      road: "Main Road",
      vehicles: 120,
    },
    {
      road: "Highway Road",
      vehicles: 200,
    },
    {
      road: "City Road",
      vehicles: 150,
    },
    {
      road: "Ring Road",
      vehicles: 180,
    },
  ];

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
        <h1>Traffic Data Visualization</h1>

        <div
          style={{
            marginTop: "30px",
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
          }}
        >
          <h3>Road Wise Vehicle Count</h3>

          {roads.map((item, index) => (
            <div
              key={index}
              style={{
                marginBottom: "20px",
              }}
            >
              <p>
                {item.road} ({item.vehicles})
              </p>

              <div
                style={{
                  backgroundColor: "#e5e7eb",
                  height: "25px",
                  borderRadius: "5px",
                }}
              >
                <div
                  style={{
                    width: `${item.vehicles / 2}px`,
                    backgroundColor: "#2563eb",
                    height: "25px",
                    borderRadius: "5px",
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default TrafficCharts;
