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

// ── New UrbanMind AI modules ────────────────────────────────────────────────
import ExplainableAI from "./pages/ExplainableAI";
import FuturePrediction from "./pages/FuturePrediction";
import RouteComparison from "./pages/RouteComparison";
import RoadSafetyIndex from "./pages/RoadSafetyIndex";
import CarbonEmission from "./pages/CarbonEmission";
import IncidentReporting from "./pages/IncidentReporting";
import EmergencyVehicle from "./pages/EmergencyVehicle";
import SmartParking from "./pages/SmartParking";
import SmartCityAnalytics from "./pages/SmartCityAnalytics";
import AICopilot from "./components/AICopilot";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Auth ── */}
        <Route path="/"                element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* ── Existing pages ── */}
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/traffic"     element={<TrafficManagement />} />
        <Route path="/analytics"   element={<TrafficAnalytics />} />
        <Route path="/charts"      element={<TrafficCharts />} />
        <Route path="/prediction"  element={<TrafficPrediction />} />
        <Route path="/ml-dashboard" element={<MLDashboard />} />
        <Route path="/users"       element={<UserManagement />} />
        <Route path="/profile"     element={<UserProfile />} />
        <Route path="/reports"     element={<ReportGeneration />} />
        <Route path="/monitoring"  element={<RealTimeMonitoring />} />
        <Route path="/route"       element={<RouteOptimization />} />

        {/* ── UrbanMind AI new modules ── */}
        <Route path="/explain"     element={<ExplainableAI />} />
        <Route path="/future"      element={<FuturePrediction />} />
        <Route path="/compare"     element={<RouteComparison />} />
        <Route path="/safety"      element={<RoadSafetyIndex />} />
        <Route path="/carbon"      element={<CarbonEmission />} />
        <Route path="/incidents"   element={<IncidentReporting />} />
        <Route path="/emergency"   element={<EmergencyVehicle />} />
        <Route path="/parking"     element={<SmartParking />} />
        <Route path="/smart-city"  element={<SmartCityAnalytics />} />
      </Routes>

      {/* ── AI Copilot (floating, shown on all pages) ── */}
      <AICopilot />
    </BrowserRouter>
  );
}

export default App;
