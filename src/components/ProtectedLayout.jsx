import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import TopNav from "./TopNav.jsx";

/** Wraps every employee page: redirects to /login when signed out, otherwise shows the nav bar. */
export default function ProtectedLayout() {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return (
    <>
      <TopNav />
      <Outlet />
    </>
  );
}
