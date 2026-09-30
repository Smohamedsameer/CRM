import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { AddLeadIcon, ClientRequestIcon, DashboardIcon, DocumentsIcon, LogoutIcon, NotificationIcon, QuotationIcon, SettingsIcon } from "./Icons.jsx";

/**
 * Left-hand navigation. On desktop it's a fixed column under the top bar (logout is in the top bar,
 * so the bottom block is hidden). On mobile it's a slide-out drawer, and logout sits at its bottom.
 */
export default function Sidebar({ open, onClose }) {
  const { session, signOut } = useAuth();

  return (
    <>
      <aside className={`sidebar${open ? " open" : ""}`}>
        <nav className="sidebar-nav" onClick={onClose}>
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
          <a
            href="https://se-quotation.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-link"
          >
            <QuotationIcon /> <span>Quotation Manually</span>
          </a>
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
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
    </>
  );
}
