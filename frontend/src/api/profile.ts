const backend_url = import.meta.env.VITE_BACKEND_URL;

export interface ProfileDto {
    username: string;
}

type AuthFetch = (
    url: string,
    options?: RequestInit
) => Promise<Response>

type ProfileData = {
    username: string;
    email: string;
};

export async function getProfileInfo(
    dto: ProfileDto,
    authFetch: AuthFetch
): Promise<ProfileData> {
    const response = await authFetch(backend_url + "/profile/" + dto.username, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return await response.json();
}