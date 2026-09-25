import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getUsername, refreshAccessToken } from "../api/auth";

type AuthContextType = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;

  username: string | null;
  setUsername: (username: string | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await refreshAccessToken();
        const sub = await getUsername(token);
        setAccessToken(token);
        setUsername(sub);
      } catch {
        // no valid refresh token: the user is not logged in
        setUsername(null);
        setAccessToken(null);
      }
    }

    restoreSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        setAccessToken,
        username,
        setUsername,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
