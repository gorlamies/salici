export type Move = {
  moveNumber: number;
  from: string;
  to: string;
  promotion: string | null;
  san: string;
  uci: string;
  fenAfter: string;
  createdAt: string;
};

export type Game = {
  id: number;
  running: boolean;
  initialFen: string;
  currentFen: string;
  result: string | null;
  createdAt: string;
  finishedAt: string | null;
  moves: Move[];
};

export async function createGame(accessToken: string): Promise<Game> {
  const response = await fetch("http://localhost:3000/games", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}