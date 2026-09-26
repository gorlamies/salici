export type ChessMoveInput = {
  from: string;
  to: string;
  promotion?: "q" | "r" | "b" | "n";
};

export type AppliedChessMove = {
  from: string;
  to: string;
  san: string;
  uci: string;
  fenAfter: string;
  turnAfter: "w" | "b";
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isInsufficientMaterial: boolean;
  isThreefoldRepetition: boolean;
  isFivefoldRepetition: boolean;
  isDrawByFiftyMoves: boolean;
  isDrawBySeventyfiveMoves: boolean;
  isDraw: boolean;
  isGameOver: boolean;
};

export type ChessPositionStatus = {
  fen: string;
  turn: "w" | "b";
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
};
