
type AuthenticatedFetchOptions = {
    accessToken: string | null
    refresh: () => Promise<string>
}


export async function authenticatedFetch(
    url: string,
    options: RequestInit,
    auth: AuthenticatedFetchOptions
): Promise<Response> {

    function send(token: string | null): Promise<Response> {
        const headers = new Headers(options.headers);

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        else {
            headers.delete("Authorization");
        }

        return fetch(url, { ...options, headers })
    }

    const response = await send(auth.accessToken)

    if (response.status !== 401) {
        return response;
    }

    const newToken = await auth.refresh();
    return send(newToken);
}