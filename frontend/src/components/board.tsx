import { Box } from "@mui/material";
import Square from "./Square";
import MoveHistory from "./MoveHistory";
import type { SquareName, Position, FenPiece, Color } from "../types/chess";
import { useState, useMemo } from "react";
import { Chess } from "chess.js";
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
  fen: string;
  onMove: (from: SquareName, to: SquareName) => void;
}

function Board({ color, position, moves, fen, onMove }: BoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<SquareName | null>(null);
  const [availableSquares, setAvailableSquares] = useState<SquareName[]>([]);
  const [draggedSquare, setDraggedSquare] = useState<SquareName | null>(null);

  const chess = useMemo(() => {
    if (!fen || fen.trim().split(/\s+/).length !== 6) {
      return null;
    }

    return new Chess(fen);
  }, [fen]);

  const kingCheckSquare = useMemo<SquareName | null>(() => {
    if (!chess) return null;
    if (!chess.isCheck()) return null;

    const kingPiece: FenPiece = chess.turn() === "w" ? "K" : "k";

    for (const [square, piece] of Object.entries(position)) {
      if (piece === kingPiece) {
        return square as SquareName;
      }
    }

    return null;
  }, [chess, position]);

  function canSelectPiece(piece: FenPiece | undefined): Boolean {
    if (!piece) return false;
    if (!color) return false;

    const isPieceUppercase = piece === piece.toUpperCase();
    const isPlayerUppercase = color === color.toUpperCase();

    return isPieceUppercase === isPlayerUppercase;
  }

  function showAvailableMoves(name: SquareName) {
    if (!chess) return [];

    const moves = chess.moves({
      square: name,
      verbose: true,
    });

    setAvailableSquares(
      moves.map(move => move.to as SquareName)
    );
  }

  function handleSquareClick(name: SquareName) {
    // deselect on double click on same square
    if (selectedSquare == name) {
      setSelectedSquare(null);
      setAvailableSquares([])
      return;
    }

    // no square selected
    if (selectedSquare == null) {
      if (canSelectPiece(position[name])) {
        setSelectedSquare(name);
        showAvailableMoves(name)
      }
      return;
    }

    // second click: ask the parent to apply this move.
    onMove(selectedSquare, name);
    setSelectedSquare(null);
    setAvailableSquares([])
  }

  function handleDragStart(name: SquareName) {
    if (!canSelectPiece(position[name])) {
      return;
    }

    setDraggedSquare(name);
    setSelectedSquare(name);
    showAvailableMoves(name)

  }

  function handleDrop(name: SquareName) {
    if (!draggedSquare) return;

    if (availableSquares.includes(name)) {
      onMove(draggedSquare, name);
    }

    setDraggedSquare(null);
    setSelectedSquare(null)
    setAvailableSquares([]);
  }

  function handleDragEnd() {
    setDraggedSquare(null);
    setAvailableSquares([]);
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
            available={availableSquares.includes(name)}
            isCheck={kingCheckSquare === name}
            onClick={handleSquareClick}
            image={piece ? pieceImages[piece] : undefined}
            orientation={color}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
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
            transform: color === "b" ? "rotate(180deg)" : "none",
          }}
        >
          {renderBoard()}
        </Box>
      </Box>
    </Box>
  );
}

export default Board;
