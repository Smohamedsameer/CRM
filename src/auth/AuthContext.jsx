import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { sessionStorageHelper, setUnauthorizedHandler } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => sessionStorageHelper.read());

  const signIn = useCallback((data) => {
    const next = { token: data.token, name: data.fullName, role: data.role };
    sessionStorageHelper.write(next);
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    sessionStorageHelper.clear();
    setSession(null);
  }, []);

  // Any 401 from the API (expired token) signs the employee out; ProtectedLayout then redirects to /login.
  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const value = useMemo(() => ({ session, signIn, signOut }), [session, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
