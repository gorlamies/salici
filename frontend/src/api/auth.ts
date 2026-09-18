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
    const response = await fetch("http://localhost:3000/auth/signup", {
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
    const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST", headers: {
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