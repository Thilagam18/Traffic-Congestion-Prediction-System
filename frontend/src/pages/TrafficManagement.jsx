import React, { useState } from "react";
import Navbar from "../components/Navbar";

function TrafficManagement() {
  const [roadName, setRoadName] = useState("");
  const [vehicleCount, setVehicleCount] = useState("");

  const [trafficData, setTrafficData] = useState([
    {
      id: 1,
      roadName: "Main Road",
      vehicleCount: 120
    }
  ]);

  const addTrafficData = () => {
    if (!roadName || !vehicleCount) {
      alert("Fill all fields");
      return;
    }

    const newRecord = {
      id: Date.now(),
      roadName,
      vehicleCount
    };

    setTrafficData([...trafficData, newRecord]);

    setRoadName("");
    setVehicleCount("");
  };

  const deleteRecord = (id) => {
    setTrafficData(
      trafficData.filter(
        (record) => record.id !== id
      )
    );
  };

  return (
    <>
      <Navbar />

      <div style={{ padding: "30px" }}>
        <h2>Traffic Data Management</h2>

        <input
          type="text"
          placeholder="Road Name"
          value={roadName}
          onChange={(e) =>
            setRoadName(e.target.value)
          }
        />

        <br /><br />

        <input
          type="number"
          placeholder="Vehicle Count"
          value={vehicleCount}
          onChange={(e) =>
            setVehicleCount(e.target.value)
          }
        />

        <br /><br />

        <button onClick={addTrafficData}>
          Add Traffic Data
        </button>

        <hr />

        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Road Name</th>
              <th>Vehicle Count</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {trafficData.map((record) => (
              <tr key={record.id}>
                <td>{record.roadName}</td>
                <td>{record.vehicleCount}</td>

                <td>
                  <button
                    onClick={() =>
                      deleteRecord(record.id)
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default TrafficManagement;
