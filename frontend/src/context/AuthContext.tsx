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

  // Restore session on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await refresh();
        const user = await getUsername(token);

        setAccessToken(token);
        setUsername(user);
      } catch {
        setAccessToken(null);
        setUsername(null);
      } finally {
        setIsAuthLoading(false);
      }
    }

    restoreSession();
  }, [refresh]);

  // SOCKET: manage the connection lifecycle
  useEffect(() => {
    if (!accessToken) {
      refreshAttempted.current = false;
      socket.disconnect();
      return;
    }

    let active = true;

    function handleConnect() {
      refreshAttempted.current = false;
    }

    async function handleConnectError(error: Error) {
      // Only attempt refresh for authentication errors.
      // This code must match the NestJS gateway error.
      const authError = error as Error & {
        data?: { code?: string };
      };

      if (authError.data?.code !== "UNAUTHORIZED") {
        return;
      }

      // Only one refresh attempt until a successful connection
      if (refreshAttempted.current) {
        return;
      }

      refreshAttempted.current = true;

      try {
        await refresh();
        // The accessToken effect will reconnect.
      } catch {
        if (!active) return;

        setAccessToken(null);
        setUsername(null);
      }
    }

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);

    socket.auth = { token: accessToken };

    // Reconnect with current credentials
    socket.disconnect();
    socket.connect();

    return () => {
      active = false;
      socket.off("connect", handleConnect);
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
