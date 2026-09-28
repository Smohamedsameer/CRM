import { useAuth } from "../auth/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";
import { LogoutIcon, MenuIcon } from "./Icons.jsx";
import logo from "../assets/logo.png";

/**
 * Top navbar on every employee page.
 * Desktop: logo (left) · "CRM of Senela International Ventures Pvt Ltd" (centre) · bell + logout (right).
 * Mobile:  menu button + bell (left) · logo + short name (right); logout lives in the slide-out sidebar.
 */
export default function TopBar({ onMenuClick }) {
  const { session, signOut } = useAuth();

  return (
    <header className="topbar">
      <button type="button" className="topbar-menu" onClick={onMenuClick} aria-label="Open menu">
        <MenuIcon />
      </button>

      <div className="topbar-brand">
        <img src={logo} alt="Senela International" className="topbar-logo" />
        <span className="topbar-brand-short">Senela CRM</span>
      </div>

      <div className="topbar-center">
        <span className="topbar-crm">CRM</span>
        <span className="topbar-of">of</span>
        <span className="topbar-company">Senela International Ventures Pvt Ltd</span>
      </div>

      <div className="topbar-actions">
        <div className="topbar-bell">
          <NotificationBell />
        </div>
        {session?.name && <span className="topbar-user muted">{session.name}</span>}
        <button type="button" className="topbar-logout" onClick={signOut}>
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
