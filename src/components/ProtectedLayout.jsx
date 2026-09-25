import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import Sidebar from "./Sidebar.jsx";

/** Wraps every employee page: redirects to /login when signed out, otherwise shows the sidebar. */
export default function ProtectedLayout() {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
