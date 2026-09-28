const backend_url = import.meta.env.VITE_BACKEND_URL;

export interface ProfileDto {
    username: string;
}

type AuthFetch = (
    url: string,
    options?: RequestInit
) => Promise<Response>

export async function getProfileInfo(
    dto: ProfileDto,
    authFetch: AuthFetch
): Promise<string> {
    const response = await authFetch(backend_url + "/profile" + dto.username, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();
    return data
}