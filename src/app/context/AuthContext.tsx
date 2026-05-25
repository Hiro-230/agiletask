import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface User {
  name: string;
  email: string;
  role: string;
  provider?: "email" | "google";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  loginWithGoogle: () => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function persistUser(userData: User) {
  localStorage.setItem("@AgileTask:currentUser", JSON.stringify(userData));
  localStorage.setItem("@AgileTask:name", userData.name);
  localStorage.setItem("@AgileTask:email", userData.email);
  localStorage.setItem("@AgileTask:role", userData.role);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("@AgileTask:currentUser");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const login = (email: string, password: string): boolean => {
    const storedEmail = localStorage.getItem("@AgileTask:email") || "estefani@exemplo.com";
    const storedPassword = localStorage.getItem("@AgileTask:password") || "123456";
    const storedName = localStorage.getItem("@AgileTask:name") || "Estefani";
    const storedRole = localStorage.getItem("@AgileTask:role") || "Designer de Produto";

    if (!localStorage.getItem("@AgileTask:password")) {
      localStorage.setItem("@AgileTask:password", "123456");
    }

    if (email === storedEmail && password === storedPassword) {
      const userData: User = {
        name: storedName,
        email: storedEmail,
        role: storedRole,
        provider: "email",
      };
      setUser(userData);
      persistUser(userData);
      return true;
    }

    return false;
  };

  const loginWithGoogle = (): boolean => {
    // Protótipo local: simula um login Google para apresentação sem exigir OAuth real.
    // Em produção, isso deve ser substituído por Firebase Auth, Supabase Auth ou Google OAuth no backend.
    const googleName = localStorage.getItem("@AgileTask:name") || "Estefani";
    const googleEmail = localStorage.getItem("@AgileTask:email") || "estefani@exemplo.com";
    const googleRole = localStorage.getItem("@AgileTask:role") || "Designer de Produto";

    const userData: User = {
      name: googleName,
      email: googleEmail,
      role: googleRole,
      provider: "google",
    };

    setUser(userData);
    persistUser(userData);
    localStorage.setItem("@AgileTask:authProvider", "google");
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("@AgileTask:currentUser");
  };

  useEffect(() => {
    const syncUserData = () => {
      const savedUser = localStorage.getItem("@AgileTask:currentUser");
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          const updatedName = localStorage.getItem("@AgileTask:name") || parsedUser.name;
          const updatedEmail = localStorage.getItem("@AgileTask:email") || parsedUser.email;
          const updatedRole = localStorage.getItem("@AgileTask:role") || parsedUser.role;

          const updatedUser = {
            ...parsedUser,
            name: updatedName,
            email: updatedEmail,
            role: updatedRole,
          };

          if (JSON.stringify(updatedUser) !== JSON.stringify(parsedUser)) {
            setUser(updatedUser);
            localStorage.setItem("@AgileTask:currentUser", JSON.stringify(updatedUser));
          }
        } catch {
          // Ignore invalid localStorage values.
        }
      }
    };

    const interval = setInterval(syncUserData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, isAuthenticated: user !== null }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
