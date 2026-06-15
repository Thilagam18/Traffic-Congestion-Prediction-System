import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RouteOptimization from "./pages/RouteOptimization";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/route"
          element={<RouteOptimization />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
