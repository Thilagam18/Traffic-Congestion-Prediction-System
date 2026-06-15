import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import RouteOptimization from "./pages/RouteOptimization";
import TrafficManagement from "./pages/TrafficManagement";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/route"
          element={<RouteOptimization />}
        />

        <Route
          path="/traffic"
          element={<TrafficManagement />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
