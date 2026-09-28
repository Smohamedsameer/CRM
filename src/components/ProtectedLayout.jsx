import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import Sidebar from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";

/** Wraps every employee page: redirects to /login when signed out, otherwise shows top bar + sidebar. */
export default function ProtectedLayout() {
  const { session } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile drawer whenever the page changes, or on Escape.
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return (
    <div className="app-shell">
      <TopBar onMenuClick={() => setMenuOpen((o) => !o)} />
      <div className="app-body">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
