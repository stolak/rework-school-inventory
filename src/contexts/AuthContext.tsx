import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchAuthMeMenus } from "@/lib/api";
import { clearUserMenus, saveUserMenus } from "@/lib/userMenusStorage";

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  userType?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function syncUserMenusFromApi(): Promise<void> {
  const res = await fetchAuthMeMenus();
  if (!res?.success || !Array.isArray(res.data?.menus)) {
    return;
  }
  saveUserMenus(res.data.menus);
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("authToken");
      const userData = localStorage.getItem("userData");

      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
          await syncUserMenusFromApi();
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    void restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Login failed");
      }

      const json = await res.json();

      const success = Boolean(json?.success);
      const message =
        typeof json?.message === "string" && json.message.trim()
          ? json.message
          : "Login failed";

      if (!success) {
        throw new Error(message);
      }

      const accessToken = json?.data?.tokens?.accessToken ?? "";
      const refreshToken = json?.data?.tokens?.refreshToken ?? "";
      const userFromApi = json?.data?.user ?? null;

      if (!accessToken || !userFromApi) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("authToken", accessToken);
      localStorage.setItem("userData", JSON.stringify(userFromApi));
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      setUser(userFromApi);

      await syncUserMenusFromApi();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("refreshToken");
    clearUserMenus();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
