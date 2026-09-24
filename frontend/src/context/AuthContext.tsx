import { createContext, useContext, useState, type ReactNode, } from "react";

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