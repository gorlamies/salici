import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Board from "../components/board"
import { Box, Button } from "@mui/material";
import { useNavigate, useParams } from "react-router";
import DialogEndGame from "../components/DialogEndGame"
import type { Color, Position, SquareName, FenPiece } from "../types/chess";
import type { Game, Move } from "../api/games";
import { io } from "socket.io-client"

const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

export function parseFen(fen: string): Position {

  const positionFen = fen.trim().split(/\s+/)[0]
  const ranksFen = positionFen.split("/")
  const position: Position = {};

  ranksFen.forEach((rankText, rowIndex) => {

    const rank = 8 - rowIndex;
    let fileIndex = 0;

    for (const char of rankText) {
      if ("12345678".includes(char)) {
        fileIndex += Number(char);
      }
      else {
        const square = `${files[fileIndex]}${rank}` as SquareName;
        position[square] = char as FenPiece;
        fileIndex += 1;
      }
    }
  })
  return position
}

function resolveResultLabel(result: string | null): string {
  switch (result) {
    case "white_win":
      return "White wins";
    case "black_win":
      return "Black wins";
    case "draw":
      return "Draw";
    default:
      return "";
  }
}

function GamePage() {
  const navigate = useNavigate()
  const { gameId } = useParams();
  const { accessToken } = useAuth();

  const socket = io("http://localhost:3000", {
    auth: {
      token: accessToken,
    },
  });

  socket.on("connect", () => {
    console.log("WebSocket connected");
    console.log(gameId)

    socket.emit("game.join", {
      gameId,
    });
  });

  socket.on("game.state", (game) => {
    console.log("Game received:", game);
  });

  socket.on("game.error", (error) => {
    console.error("Game error:", error);
  });



  const [position, setPosition] = useState<Position>({});
  const [moves, setMoves] = useState<Move[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  /*
  useEffect(() => {

    function handleState(game: Game) {
      setPosition(parseFen(game.currentFen));
      setMoves(game.moves);
      setErrorMessage(null);
      setGameOver(!game.running);
      setResult(game.result);
    }

    function handleError(error: { message: string }) {
      setErrorMessage(error.message);
    }

    socket.on("game.state", handleState);
    socket.on("game.error", handleError);

    socket.connect();
    socket.emit("game.join", { gameId });

    return () => {
      socket.off("game.state", handleState);
      socket.off("game.error", handleError);
      socket.disconnect();
    };
  }, [gameId]);
  */

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
          color="W"
          position={position}
          moves={moves}
          errorMessage={errorMessage}
          onMove={handleMove}
        />
      </Box>
      <Button
        variant="contained"
        onClick={() => navigate("/")}>
        homepage
      </Button>
      <DialogEndGame open={gameOver} result={resolveResultLabel(result)} />
    </>
  )
}

export default GamePage