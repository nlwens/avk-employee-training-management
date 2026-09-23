import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import { decodeToken } from "./token";

type User = {
  id: string;
  name: string;
  surname: string;
  admin: boolean;
};

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const STORAGE_KEY = "accessToken";

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  const user = useMemo<User | null>(() => {
    if (!token) return null;

    try {
      const decoded = decodeToken(token);

      if (!decoded) return null;

      return {
        id: decoded.sub,
        name: decoded.name,
        surname: decoded.surname,
        admin: decoded.admin,
      };
    } catch (error) {
      console.error("Invalid token: ", error);
      return null;
    }
  }, [token]);

  const login = useCallback((newToken: string) => {
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
  }, []);

  const isAuthenticated = !!token && !!user;

  const value = useMemo<AuthContextType>(
    () => ({
      token,
      user,
      isAuthenticated,
      login,
      logout,
    }),
    [token, user, isAuthenticated, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
