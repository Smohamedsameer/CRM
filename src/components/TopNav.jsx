import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function TopNav() {
  const { session, signOut } = useAuth();
  return (
    <header className="top-nav">
      <NavLink to="/dashboard" className="brand">Leads &amp; Quotations</NavLink>
      <nav>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/leads/new">+ Add Lead</NavLink>
        {session?.name && <span className="muted user-name">{session.name}</span>}
        <button type="button" className="link-btn" onClick={signOut}>Logout</button>
      </nav>
    </header>
  );
}
