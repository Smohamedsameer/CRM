import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container narrow">
      <div className="card">
        <h2>Page not found</h2>
        <p className="muted">This link doesn't lead anywhere. If a customer link isn't working, ask the sender for a new one.</p>
        <Link to="/dashboard">Go to the dashboard</Link>
      </div>
    </div>
  );
}
