import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedLayout from "./components/ProtectedLayout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AddLead from "./pages/AddLead.jsx";
import LeadDetail from "./pages/LeadDetail.jsx";
import Enquiry from "./pages/Enquiry.jsx";
import Quotation from "./pages/Quotation.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <Routes>
      {/* Customer-facing pages: reached from WhatsApp links, secured by the token in the URL */}
      <Route path="/enquiry/:token" element={<Enquiry />} />
      <Route path="/quotation/:token" element={<Quotation />} />

      {/* Employee pages */}
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leads/new" element={<AddLead />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
