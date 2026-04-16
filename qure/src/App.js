import L from "leaflet";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/Admin-dashboard";
import PatientDashboard from "./pages/Patient-dashboard";
import AuthCallback from "./pages/AuthCallback";
import StaffDashboard from "./pages/Staff-dashboard";
import BookAppointment from "./pages/BookAppointment";
import QueuePage from "./pages/QueuePage";
import AppointmentsPage from "./pages/AppointmentsPage";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/patient/book" element={<BookAppointment />} />
        <Route path="/patient/queue" element={<QueuePage />} />
        <Route path="/patient/appointments" element={<AppointmentsPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/staff" element={<StaffDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;