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
import ResetPasswordPage from "./pages/resetPasswordPage";
import StaffAuth from "./pages/staffAuth";
import AdminAuth from "./pages/adminAuth";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/patient/book" element={<BookAppointment />} />
        <Route path="/patient/queue" element={<QueuePage />} />
        <Route path="/patient/appointments" element={<AppointmentsPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/admin/auth/callback" element={<AdminAuth />} />
        <Route path="/staff/auth/callback" element={<StaffAuth />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        
      </Routes>
    </Router>
  );
}

export default App;