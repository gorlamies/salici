import { Box } from "@mui/material";
import Square from "./Square"
import type { SquareName, Position, FenPiece, Color } from "../types/chess";
import { useState, useEffect } from "react";
import { socket } from "../socket"
import type { Game } from "../api/games";
import { Transform } from "@mui/icons-material";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const ranks = [8, 7, 6, 5, 4, 3, 2, 1] as const;
// const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

const pieceImages: Record<FenPiece, string> = {
  p: "/pieces/PawnBlack.svg",
  P: "/pieces/PawnWhite.svg",
  b: "/pieces/BishopBlack.svg",
  B: "/pieces/BishopWhite.svg",
  n: "/pieces/KnightBlack.svg",
  N: "/pieces/KnightWhite.svg",
  q: "/pieces/QueenBlack.svg",
  Q: "/pieces/QueenWhite.svg",
  k: "/pieces/KingBlack.svg",
  K: "/pieces/KingWhite.svg",
  r: "/pieces/RookBlack.svg",
  R: "/pieces/RookWhite.svg",
}

interface BoardProps {
  color: Color
  gameId: Number
}

function Board({ color, gameId }: BoardProps) {

  const [selectedSquare, setSelectedSquare] = useState<SquareName | null>(null);
  const [position, setPosition] = useState<Position>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {

    function handleState(game: Game) {
      setPosition(parseFen(game.currentFen));
      setErrorMessage(null);
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

  function canSelectPiece(piece: FenPiece | undefined): Boolean {

    if (!piece) return false

    const isPieceUppercase = piece === piece.toUpperCase()
    const isPlayerUppercase = color === color.toUpperCase()

    return isPieceUppercase === isPlayerUppercase
  }
  function handleSquareClick(name: SquareName) {

    // deselect on double click on same square
    if (selectedSquare == name) {
      setSelectedSquare(null)
      return
    }

    // no square selected
    if (selectedSquare == null) {
      if (canSelectPiece(position[name])) {
        setSelectedSquare(name)
      }
      return
    }

    // second click: ask the server to apply this move, don't touch the board ourselves
    socket.emit("game.move", {
      gameId,
      move: { from: selectedSquare, to: name },
    });
    setSelectedSquare(null)
  }

  function renderBoard() {

    return ranks.map((rank, rowIndex) =>
      files.map((file, columnIndex) => {
        const name: SquareName = `${file}${rank}`;
        const piece = position[name];

        return (
          <Square
            key={name}
            name={name}
            dark={(rowIndex + columnIndex) % 2 === 1}
            selected={selectedSquare === name}
            onClick={handleSquareClick}
            image={piece ? pieceImages[piece] : undefined}
            orientation={color}
          />
        );
      })
    );
  }

  function parseFen(fen: string): Position {

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


  return (
    <Box>
      {errorMessage && (
        <Box sx={{ color: "error.main", mb: 1 }}>{errorMessage}</Box>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          width: "100%",
          maxWidth: 560,
          transform: color === "b" ? "rotate(180deg)" : "none",
        }}
      >
        {renderBoard()}
      </Box>
    </Box>
  );
}

export default Board