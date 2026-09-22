import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { login } from "../api/index.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Alert from "../components/Alert.jsx";

export default function Login() {
  const { session, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      signIn(data);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.status === 401 || err.status === 403 ? "Invalid email or password." : err.message);
      setLoading(false);
    }
  }

  return (
    <div className="container narrow login-wrap">
      <div className="card">
        <h2>Employee login</h2>
        <Alert>{error}</Alert>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Signing in…" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
