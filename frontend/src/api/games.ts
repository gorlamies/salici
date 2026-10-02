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
  initialTimeMs: number | null;
  incrementMs: number | null;
  whiteRemainingMs: number | null;
  blackRemainingMs: number | null;
  firstMoveRemainingMs: number | null;
  moves: Move[];
};

export interface CreateGameDto {
  playerOneUsername: string;
  playerTwoUsername: string;
  initialTimeMs: number | null;
  incrementMs: number | null;
}


type AuthFetch = (
  url: string,
  options?: RequestInit
) => Promise<Response>

export async function createGame(
  dto: CreateGameDto,
  authFetch: AuthFetch
): Promise<string> {
  const response = await authFetch(backend_url + "/games", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.gameId; // data has the whole server GameDto
}

export async function getGamestate(gameId: string, authFetch: AuthFetch): Promise<Game> {
  const response = await authFetch(backend_url + "/games/" + gameId, {
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

export async function getOpenGames(authFetch: AuthFetch): Promise<Game[]> {
  const response = await authFetch(backend_url + "/games", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return await response.json();
}

