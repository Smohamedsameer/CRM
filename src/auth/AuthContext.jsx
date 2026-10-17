import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isTokenExpired, sessionStorageHelper, setUnauthorizedHandler, tokenExpiryMs } from "../api/client.js";

const AuthContext = createContext(null);

/** The login page reads this flag to explain why the employee landed there. */
export const EXPIRED_FLAG = "lqs_expired";

function markExpired() {
  try { sessionStorage.setItem(EXPIRED_FLAG, "1"); } catch { /* storage unavailable: just skip the message */ }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const stored = sessionStorageHelper.read();
    // A token that expired while the browser was closed must not count as "logged in".
    if (stored && isTokenExpired(stored.token)) {
      sessionStorageHelper.clear();
      markExpired();
      return null;
    }
    return stored;
  });

  const signIn = useCallback((data) => {
    const next = { token: data.token, name: data.fullName, role: data.role };
    sessionStorageHelper.write(next);
    setSession(next);
  }, []);

  /** Normal logout button. */
  const signOut = useCallback(() => {
    sessionStorageHelper.clear();
    setSession(null);
  }, []);

  /** Session ran out (or the server rejected the token): sign out and tell the login page why. */
  const expireSession = useCallback(() => {
    markExpired();
    sessionStorageHelper.clear();
    setSession(null);
  }, []);

  // Any 401 from the API signs the employee out; ProtectedLayout then redirects to /login.
  useEffect(() => {
    setUnauthorizedHandler(expireSession);
    return () => setUnauthorizedHandler(null);
  }, [expireSession]);

  // Log out at the moment the token expires, even if the page is just sitting open. Checked every 30 s
  // and whenever the tab becomes visible again (timers are paused while a laptop sleeps).
  useEffect(() => {
    if (!session) return undefined;
    const expiresAt = tokenExpiryMs(session.token);
    if (expiresAt === null) return undefined;
    const check = () => { if (Date.now() >= expiresAt) expireSession(); };
    const timer = setInterval(check, 30_000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    check();
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [session, expireSession]);

  const value = useMemo(() => ({ session, signIn, signOut }), [session, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
