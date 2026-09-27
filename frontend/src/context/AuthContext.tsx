import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode, } from "react";
import { getUsername, refreshAccessToken } from "../api/auth"

type AuthContextType = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  username: string | null;
  setUsername: (username: string | null) => void;
  refresh: () => Promise<string>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const refreshPromise = useRef<Promise<string> | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  // define funtion, pass it to auth fetch
  const refresh = useCallback((): Promise<string> => {
    if (!refreshPromise.current) {
      refreshPromise.current = refreshAccessToken()
        .then((token) => {
          setAccessToken(token);
          return token;
        })
        .finally(() => {
          refreshPromise.current = null;
        });
    }

    return refreshPromise.current;
  }, []);

  // triggers on component mount, refresh the access token
  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await refresh();
        const user = await getUsername(token);

        setAccessToken(token);
        setUsername(user);
      }
      catch {
        setAccessToken(null);
        setUsername(null);
      }
      finally {
        setIsAuthLoading(false);
      }
    }
    restoreSession();
  }, [refresh])


  return (
    <AuthContext.Provider
      value={{
        accessToken,
        setAccessToken,
        username,
        setUsername,
        refresh
      }}
    >
      {isAuthLoading ? <div>Loading session…</div> : children}
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
