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

export interface CreateGameDto {
  playerOneUsername: string;
  playerTwoUsername: string
}

export async function createGame(dto: CreateGameDto, accessToken: string,): Promise<string> {
  const response = await fetch("http://localhost:3000/games", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const data = await response.json();

  return data.gameId
}