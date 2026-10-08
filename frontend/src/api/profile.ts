import type { TimeCategory } from "./games";

const backend_url = import.meta.env.VITE_BACKEND_URL;

export interface ProfileDto {
    username: string;
}

type AuthFetch = (
    url: string,
    options?: RequestInit
) => Promise<Response>

export type Rating = {
    timeCategory: TimeCategory;
    rating: number;
    provisional: boolean;
};

export type Profile = {
    username: string;
    createdAt: string;
    closedAt: string | null;
    ratings: Rating[];
    ongoingGameId: string | null;
    // only in your own profile
    email?: string;
    hideOnlineStatus?: boolean;
};

export type GameSummary = {
    id: string;
    state: string;
    createdAt: string;
    finishedAt: string | null;
    whitePlayerUsername: string | null;
    blackPlayerUsername: string | null;
    currentFen: string;
    timeCategory: TimeCategory;
    timeLabel: string;
    whiteRatingBefore: number | null;
    whiteRatingAfter: number | null;
    blackRatingBefore: number | null;
    blackRatingAfter: number | null;
};

export type ProfileGames = {
    games: GameSummary[];
    nextCursor: string | null;
};

export async function getProfile(
    username: string,
    authFetch: AuthFetch
): Promise<Profile> {
    const response = await authFetch(backend_url + "/profile/" + encodeURIComponent(username), {
        method: "GET",
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return await response.json();
}

export async function getProfileGames(
    username: string,
    cursor: string | null,
    category: TimeCategory | null,
    authFetch: AuthFetch
): Promise<ProfileGames> {
    const params = new URLSearchParams();
    if (cursor !== null) params.set("cursor", cursor);
    if (category !== null) params.set("category", category);

    const response = await authFetch(
        backend_url + "/profile/" + encodeURIComponent(username) + "/games?" + params.toString(),
        { method: "GET" }
    );

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return await response.json();
}