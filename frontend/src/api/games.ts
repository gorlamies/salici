export async function createGame(): Promise<string> {
    const response = await fetch("http://localhost:3000/games", { method: "POST" });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }
    const data = await response.json();
    return data;
}