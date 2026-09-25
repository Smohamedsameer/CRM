import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";
import logo from "../assets/logo.png";

/** Left-hand navigation shown on every employee page. Logout is pinned to the bottom-left. */
export default function Sidebar() {
  const { session, signOut } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={logo} alt="Senela International" className="sidebar-logo" />
        <span className="sidebar-brand-text">Senela CRM</span>
      </div>

      <div className="sidebar-notif">
        <NotificationBell />
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className="sidebar-link">Dashboard</NavLink>
        <NavLink to="/leads/new" className="sidebar-link">+ Add Lead</NavLink>
      </nav>

      <div className="sidebar-bottom">
        {session?.name && <div className="sidebar-user muted">{session.name}</div>}
        <button type="button" className="sidebar-logout" onClick={signOut}>
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 17l5-5-5-5M20 12H9M12 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
