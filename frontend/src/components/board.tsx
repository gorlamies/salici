import { Box } from "@mui/material";
import Square from "./Square";
import MoveHistory from "./MoveHistory";
import type { SquareName, Position, FenPiece, Color } from "../types/chess";
import { useState } from "react";
import type { Move } from "../api/games";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const ranks = [8, 7, 6, 5, 4, 3, 2, 1] as const;

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
};

interface BoardProps {
  color: Color | null;
  position: Position;
  moves: Move[];
  onMove: (from: SquareName, to: SquareName) => void;
}

function Board({ color, position, moves, onMove }: BoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<SquareName | null>(null);

  function canSelectPiece(piece: FenPiece | undefined): Boolean {
    if (!piece) return false;
    if (!color) return false;

    const isPieceUppercase = piece === piece.toUpperCase();
    const isPlayerUppercase = color === color.toUpperCase();

    return isPieceUppercase === isPlayerUppercase;
  }

  function handleSquareClick(name: SquareName) {
    // deselect on double click on same square
    if (selectedSquare == name) {
      setSelectedSquare(null);
      return;
    }

    // no square selected
    if (selectedSquare == null) {
      if (canSelectPiece(position[name])) {
        setSelectedSquare(name);
      }
      return;
    }

    // second click: ask the parent to apply this move, don't touch the board ourselves
    onMove(selectedSquare, name);
    setSelectedSquare(null);
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
      }),
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
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
        <MoveHistory moves={moves} />
      </Box>
    </Box>
  );
}

export default Board;
