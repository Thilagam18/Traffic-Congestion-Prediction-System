import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import TrafficManagement from "./pages/TrafficManagement";
import TrafficAnalytics from "./pages/TrafficAnalytics";
import TrafficCharts from "./pages/TrafficCharts";
import TrafficPrediction from "./pages/TrafficPrediction";
import MLDashboard from "./pages/MLDashboard";
import UserManagement from "./pages/UserManagement";
import UserProfile from "./pages/UserProfile";
import ReportGeneration from "./pages/ReportGeneration";
import RealTimeMonitoring from "./pages/RealTimeMonitoring";
import RouteOptimization from "./pages/RouteOptimization";

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
          path="/traffic"
          element={<TrafficManagement />}
        />

        <Route
          path="/analytics"
          element={<TrafficAnalytics />}
        />

        <Route
          path="/charts"
          element={<TrafficCharts />}
        />

        <Route
          path="/prediction"
          element={<TrafficPrediction />}
        />

        <Route
          path="/ml-dashboard"
          element={<MLDashboard />}
        />

        <Route
          path="/users"
          element={<UserManagement />}
        />

        <Route
          path="/profile"
          element={<UserProfile />}
        />

        <Route
          path="/reports"
          element={<ReportGeneration />}
        />

        <Route
          path="/monitoring"
          element={<RealTimeMonitoring />}
        />

        <Route
          path="/route"
          element={<RouteOptimization />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
