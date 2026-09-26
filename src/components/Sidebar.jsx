import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";
import { AddLeadIcon, ClientRequestIcon, DashboardIcon, DocumentsIcon, LogoutIcon, NotificationIcon, SettingsIcon } from "./Icons.jsx";
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
        <NavLink to="/dashboard" className="sidebar-link">
          <DashboardIcon /> <span>Dashboard</span>
        </NavLink>
        <NavLink to="/leads/new" className="sidebar-link">
          <AddLeadIcon /> <span>Add Lead</span>
        </NavLink>
        <NavLink to="/notifications" className="sidebar-link">
          <NotificationIcon /> <span>Notification</span>
        </NavLink>
        <NavLink to="/client-requests" className="sidebar-link">
          <ClientRequestIcon /> <span>Client Request</span>
        </NavLink>
        <NavLink to="/documents" className="sidebar-link">
          <DocumentsIcon /> <span>Certificates &amp; Documents</span>
        </NavLink>
        <NavLink to="/settings" className="sidebar-link">
          <SettingsIcon /> <span>Settings</span>
        </NavLink>
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
