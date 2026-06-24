import React, { useState } from "react";

function TrafficForm() {
  const [roadName, setRoadName] = useState("");
  const [vehicleCount, setVehicleCount] =
    useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    alert(
      `Road: ${roadName}\nVehicles: ${vehicleCount}`
    );

    setRoadName("");
    setVehicleCount("");
  };

  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        marginTop: "20px",
      }}
    >
      <h2>Add Traffic Data</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Road Name"
          value={roadName}
          onChange={(e) =>
            setRoadName(e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
          }}
        />

        <input
          type="number"
          placeholder="Vehicle Count"
          value={vehicleCount}
          onChange={(e) =>
            setVehicleCount(e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
          }}
        />

        <button
          type="submit"
          style={{
            backgroundColor: "#16a34a",
            color: "white",
            padding: "10px 20px",
            border: "none",
          }}
        >
          Save Data
        </button>
      </form>
    </div>
  );
}

export default TrafficForm;
