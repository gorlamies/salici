import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { authenticatedFetch } from "../api/client";

export function useAuthenticatedFetch() {
    const { accessToken, refresh } = useAuth();

    return useCallback(
        (url: string, options: RequestInit = {}): Promise<Response> => {
            return authenticatedFetch(url, options, {
                accessToken,
                refresh,
            });
        },
        [accessToken, refresh],
    );
}