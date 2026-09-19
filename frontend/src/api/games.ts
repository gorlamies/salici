export type Game = {
  id: number;
  running: boolean;
  initialFen: string;
  currentFen: string;
  result: string | null;
  createdAt: string;
  finishedAt: string | null;
};

export async function createGame(): Promise<Game> {
  const response = await fetch("http://localhost:3000/games", { method: "POST" });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}