import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Board from "../components/board";
import { Box, Button } from "@mui/material";
import { useNavigate, useParams } from "react-router";
import DialogEndGame from "../components/DialogEndGame";
import type { Color, Position, SquareName, FenPiece } from "../types/chess";
import type { Game, Move } from "../api/games";
import { socket } from "../socket";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

export function parseFen(fen: string): Position {
  const positionFen = fen.trim().split(/\s+/)[0];
  const ranksFen = positionFen.split("/");
  const position: Position = {};

  ranksFen.forEach((rankText, rowIndex) => {
    const rank = 8 - rowIndex;
    let fileIndex = 0;

    for (const char of rankText) {
      if ("12345678".includes(char)) {
        fileIndex += Number(char);
      } else {
        const square = `${files[fileIndex]}${rank}` as SquareName;
        position[square] = char as FenPiece;
        fileIndex += 1;
      }
    }
  });
  return position;
}

type GameError = {
  status_code: number;
  message: string;
};

function GamePage() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const { accessToken, username } = useAuth();

  const [position, setPosition] = useState<Position>({});
  const [moves, setMoves] = useState<Move[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [color, setColor] = useState<Color | null>(null);

  useEffect(() => {
    function handleConnect() {
      socket.emit("game.join", { gameId });
    }

    function handleState(game: Game) {
      setPosition(parseFen(game.currentFen));

      if (game.whitePlayerUsername === username) setColor("W");
      else if (game.blackPlayerUsername === username) setColor("b");

      setMoves(game.moves);

      setGameOver(game.finishedAt !== null);
      // set result
      switch (game.state) {
        case "white_win":
          setResult("White wins");
          break;
        case "black_win":
          setResult("Black wins");
          break;
        case "draw":
          setResult("Draw");
          break;
        default:
          setResult(null);
      }
    }

    async function handleError(error: GameError) {
      console.log(error.message);
    }

    socket.auth = { token: accessToken };

    socket.on("connect", handleConnect);
    socket.on("game.state", handleState);
    socket.on("game.error", handleError);

    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("game.state", handleState);
      socket.off("game.error", handleError);
      socket.disconnect();
    };
  }, [gameId, accessToken, username, navigate]);

  function handleMove(from: SquareName, to: SquareName) {
    socket.emit("game.move", {
      gameId,
      move: { from, to },
    });
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          p: 3,
          boxSizing: "border-box",
        }}
      >
        <Board
          color={color}
          position={position}
          moves={moves}
          onMove={handleMove}
        />
      </Box>
      <Button variant="contained" onClick={() => navigate("/")}>
        homepage
      </Button>
      <DialogEndGame open={gameOver} result={result} />
    </>
  );
}

export default GamePage;
