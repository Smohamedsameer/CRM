import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";
import {
  AddLeadIcon,
  ClientRequestIcon,
  DashboardIcon,
  DocumentsIcon,
  LogoutIcon,
  NotificationIcon,
} from "./Icons.jsx";
import logo from "../assets/logo.png";

const navItems = [
  { to: "/dashboard", label: "Dashboard", Icon: DashboardIcon },
  { to: "/leads/new", label: "Add Lead", Icon: AddLeadIcon },
  { to: "/notifications", label: "Notification", Icon: NotificationIcon },
  { to: "/client-requests", label: "Client Request", Icon: ClientRequestIcon },
  { to: "/documents", label: "Certificates & Documents", Icon: DocumentsIcon },
];

export default function Sidebar() {
  const { session, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeMenu();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("mobile-menu-open", open);
    return () => document.body.classList.remove("mobile-menu-open");
  }, [open]);

  const handleLogout = () => {
    closeMenu();
    signOut();
  };

  return (
    <>
      <header className="mobile-topbar">
        <button
          type="button"
          className="mobile-menu-button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className="mobile-topbar-brand">
          <img src={logo} alt="Senela International" />
          <span>Senela CRM</span>
        </div>
      </header>

      {open && <button type="button" className="sidebar-overlay" aria-label="Close menu" onClick={closeMenu} />}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-mobile-header">
          <div className="sidebar-brand">
            <img src={logo} alt="Senela International" className="sidebar-logo" />
            <span className="sidebar-brand-text">Senela CRM</span>
          </div>
          <button type="button" className="sidebar-close" aria-label="Close menu" onClick={closeMenu}>
            <span />
            <span />
          </button>
        </div>

        <div className="sidebar-brand sidebar-desktop-brand">
          <img src={logo} alt="Senela International" className="sidebar-logo" />
          <span className="sidebar-brand-text">Senela CRM</span>
        </div>

        <div className="sidebar-notif">
          <NotificationBell />
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className="sidebar-link" onClick={closeMenu}>
              <Icon /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {session?.name && <div className="sidebar-user muted">{session.name}</div>}
          <button type="button" className="sidebar-logout" onClick={handleLogout}>
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
