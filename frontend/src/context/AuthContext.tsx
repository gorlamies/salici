import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode, } from "react";
import { getUsername, refreshAccessToken } from "../api/auth"
import { socket } from "../socket"

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

  // SOCKET: track authentication recovery attempts
  const refreshAttempted = useRef(false);

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



  // SOCKET: manage the connection lifecycle
  useEffect(() => {

    async function handleConnectError(error: Error) {

      const authError = error as Error & {
        data?: { status_code?: number };
      };

      // this blocks every error that is not due to auth
      if (authError.data?.status_code !== 401) {
        console.error("Socket connection error:", error);
        return;
      }

      try {
        await refresh();
        // The accessToken effect will reconnect.
      } catch {
        setAccessToken(null);
        setUsername(null);
      }
    }

    if (!accessToken) {
      socket.disconnect();
      return;
    }

    socket.auth = { token: accessToken };
    socket.on("connect_error", handleConnectError);

    // Reconnect with current credentials
    socket.disconnect();
    socket.connect();

    return () => {
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
    };
  }, [accessToken, refresh]);


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
