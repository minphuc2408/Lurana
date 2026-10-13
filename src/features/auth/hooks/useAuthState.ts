import { useState } from "react";
import { authenticateDemo, readDemoSession, saveDemoSession } from "../auth.service";
export function useAuthState() {
  const [user, setUser] = useState(readDemoSession);
  const login = (email: string, password: string) => {
    const result = authenticateDemo(email, password);
    if (result.success) { setUser(result.user); saveDemoSession(result.user); }
    return result;
  };
  const logout = () => { setUser(null); saveDemoSession(null); };
  return { user, login, logout };
}
