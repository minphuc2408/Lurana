import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "user" | "admin";

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => { success: boolean; user?: AuthUser; error?: string };
  logout: () => void;
}

const ACCOUNTS: Array<AuthUser & { password: string }> = [
  {
    name: "Maria Santos",
    email: "mariasantos@sample.com",
    password: "maria2004",
    role: "user",
  },
  {
    name: "Tan Kurt",
    email: "tankurt@sample.com",
    password: "kurt0428",
    role: "admin",
  },
];

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = sessionStorage.getItem("lunara_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (email: string, password: string) => {
    const found = ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    );
    if (!found) {
      return { success: false, error: "Invalid email or password." };
    }
    const { password: _pw, ...authUser } = found;
    setUser(authUser);
    sessionStorage.setItem("lunara_user", JSON.stringify(authUser));
    return { success: true, user: authUser };
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("lunara_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}