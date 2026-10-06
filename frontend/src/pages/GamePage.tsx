import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { Alert, Box, Button } from "@mui/material";
import { useNavigate, useParams } from "react-router";
import type { Color, Position, SquareName, FenPiece } from "../types/chess";
import type { Game, Move } from "../api/games";
import { socket } from "../socket"
import { playSound } from "../sound";
import { useBoardTransition } from "../context/BoardTransitionContext";

import DialogEndGame from "../components/DialogEndGame";
import Timer from "../components/Timer"
import BoardStage from "../components/BoardStage";

import {
  BOARD_SIZE,
  BOARD_HALF,
} from "../components/BoardStage";

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

function GamePage() {

  const {
    setMode,
    setColor,
    color,
    setPosition,
    setFen,
    setOnMove,
    setTransitioning,
  } = useBoardTransition();

  const navigate = useNavigate();
  const { gameId } = useParams();
  const { accessToken, username, refresh } = useAuth();
  const refreshAttempted = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [blackTimeMs, setBlackTimeMs] = useState<number | null>(null)
  const [whiteTimeMs, setWhiteTimeMs] = useState<number | null>(null)
  const [firstMoveMs, setFirstMoveMs] = useState<number | null>(null)
  const [activeColor, setActiveColor] = useState<"w" | "b">("w");
  const [clocksStarted, setClocksStarted] = useState(false);
  const [currentFen, setCurrentfen] = useState<string>("")


  const bottomColor = color === "b" ? "b" : "w";

  const bottomTime = bottomColor === "w" ? whiteTimeMs : blackTimeMs;
  const topTime = bottomColor === "w" ? blackTimeMs : whiteTimeMs;

  const bottomRunning = clocksStarted && activeColor === bottomColor;
  const topRunning = clocksStarted && activeColor !== bottomColor;

  useEffect(() => {

    function handleConnect() {
      refreshAttempted.current = false;
      socket.emit("game.join", { gameId });
    }

    function handleState(game: Game) {

      setErrorMessage(null);
      setPosition(parseFen(game.currentFen));
      setCurrentfen(game.currentFen)

      if (game.whitePlayerUsername === username) setColor("W");
      else if (game.blackPlayerUsername === username) setColor("b");
      else (setColor("W"))

      setBlackTimeMs(game.blackRemainingMs)
      setWhiteTimeMs(game.whiteRemainingMs)
      setFirstMoveMs(game.firstMoveRemainingMs)
      setMoves(game.moves);

      // control the move to arrive
      if (game.currentFen !== game.initialFen && (game.state === "running" || game.state === "ready")) {
        // if is check, play this sound instead
        const lastMove = game.moves.at(-1);
        if (lastMove) {
          if (lastMove.san.includes("+")) {
            playSound("check")
          }
          else if (lastMove.san.includes("x")) {
            playSound("capture")
          }
          else { playSound("move"); }
        }
      }


      setActiveColor(game.currentFen.trim().split(/\s+/)[1] as "w" | "b");
      setClocksStarted(game.moves.length >= 2 && game.finishedAt === null);

      setGameOver(game.finishedAt !== null);

      switch (game.state) {
        case "white_win":
          setResult("White wins");
          break;
        case "black_win":
          setResult("Black wins");
          break;
        case "white_resigned":
          setResult("White resigned");
          break;
        case "black_resigned":
          setResult("Black resigned");
          break;
        case "white_timeout":
          setResult("White ran out of time");
          break;
        case "black_timeout":
          setResult("Black ran out of time");
          break;
        case "draw":
          setResult("Draw");
          break;
        case "stalemate":
          setResult("Stalemate");
          break;
        case "insufficient_material":
          setResult("Draw for insufficient material");
          break;
        case "threefold_repetition":
          setResult("Draw for threefold repetition");
          break;
        case "fivefold_repetition":
          setResult("Draw for fivefold repetition");
          break;
        case "fifty_move_rule":
          setResult("Draw for fifty-move rule");
          break;
        case "seventy_five_move_rule":
          setResult("Draw for seventy-five-move rule");
          break;
        case "aborted":
          setResult("Game aborted");
          break;
        default:
          setResult(null);
      }
    }

    async function handleConnectionError(error: Error) {
      const connectionError = error as Error & {
        data?: {
          status_code: number;
          message: string;
        };
      };
      if (connectionError.data?.status_code !== 401) {
        console.log(connectionError.message);
        return;
      }

      if (refreshAttempted.current) {
        console.error("Authentication failed after refreshing.");
        navigate("/auth")
        return;
      }

      refreshAttempted.current = true;
      try {
        await refresh();
      } catch {
        return;
      }
    }

    function handleError(error: { message: string }) {
      setErrorMessage(error.message);
    }

    setMode("game");
    setTransitioning(false);
    setOnMove(handleMove);

    socket.auth = { token: accessToken };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectionError);
    socket.on("game.state", handleState);
    socket.on("game.error", handleError);

    socket.connect();

    return () => {
      setOnMove(null);
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectionError);
      socket.off("game.state", handleState);
      socket.off("game.error", handleError);
      socket.disconnect();
    };
  }, [gameId, accessToken, username, navigate, refresh]);

  const handleMove = useCallback((from: SquareName, to: SquareName) => {
    socket.emit("game.move", {
      gameId,
      move: { from, to },
    });
  },
    [gameId]
  )

  function handleResign() {
    socket.emit("game.resign", {
      gameId,
    });
  }

  return (
    <>
      {/* TOP TIMER */}
      <Box
        sx={{
          position: "absolute",
          left: "50%",
          top: `calc(45% - ${BOARD_HALF})`,
          transform: "translateX(-50%)",
          pointerEvents: "auto",

        }}
      >
        <Timer
          time={topTime}
          running={topRunning}
        />
      </Box>

      {/* BOTTOM TIMER */}
      <Box
        sx={{
          position: "absolute",
          left: "50%",
          top: `calc(52% + ${BOARD_HALF} )`,
          transform: "translateX(-50%)",
          pointerEvents: "auto",

        }}
      >
        <Timer
          time={bottomTime}
          running={bottomRunning}
        />
      </Box>

      {/* RESIGN BUTTON */}
      <Box
        sx={{
          position: "absolute",
          left: `calc(50% + ${BOARD_HALF} )`,
          bottom: 32,
          pointerEvents: "auto",
        }}
      >
        <Button
          variant="contained"
          onClick={handleResign}
        >
          Resign
        </Button>
      </Box>
      <DialogEndGame
        open={gameOver}
        result={result}
      />
    </>
  );
}

export default GamePage;
