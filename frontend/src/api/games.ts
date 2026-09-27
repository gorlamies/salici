const backend_url = import.meta.env.VITE_BACKEND_URL;

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
  id: string;
  state: string;
  initialFen: string;
  currentFen: string;
  createdAt: string;
  finishedAt: string | null;
  whitePlayerUsername: string | null;
  blackPlayerUsername: string | null;
  moves: Move[];
};

export interface CreateGameDto {
  playerOneUsername: string;
  playerTwoUsername: string;
}

export async function createGame(
  dto: CreateGameDto,
  accessToken: string,
): Promise<string> {
  const response = await fetch(backend_url + "/games", {
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

  return data.id; // data has the whole server GameDto
}

export async function getOpenGames(accessToken: string | null): Promise<Game[]> {
  const response = await fetch(backend_url + "/games", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return await response.json();
}

