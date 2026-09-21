const backend_url = import.meta.env.VITE_BACKEND_URL

export interface SignupDto {
    username: string;
    email: string;
    password: string;
}

export interface LoginDto {
    username: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
}
export async function signup(dto: SignupDto) {
    const response = await fetch(backend_url + "/auth/signup", {
        method: "POST", headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }
    return
}

export async function login(dto: LoginDto): Promise<LoginResponse> {
    const response = await fetch(backend_url + "/auth/login", {
        method: "POST",
        credentials: 'include',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }
    const data = await response.json();
    return data;
}

export async function refreshAccessToken() {
    const response = await fetch(backend_url + "/auth/refresh", {
        method: 'POST',
        credentials: 'include',
    })
    if (!response.ok) {
        const body = await response.text();
        console.log('refresh error body:', body);
        throw new Error('Unable to refresh session');
    }
    const data = await response.json();
    return data.accessToken;
}