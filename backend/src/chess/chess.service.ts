import { Injectable } from "@nestjs/common";
import { Chess, Move } from "chess.js";
import {
  ChessMoveInput,
  AppliedChessMove,
  ChessPositionStatus,
} from "./chess.types";
import {
  InvalidFenError,
  IllegalMoveError,
  InvalidMoveHistoryError,
} from "./chess.errors";

@Injectable()
export class ChessService {
  createInitialPosition(): string {
    const chess = new Chess();
    return chess.fen();
  }

  /**
   * Status of a single position, from its FEN only.
   * It knows nothing about the moves that led to it, so it cannot detect a
   * threefold repetition: for a game in progress use the flags returned by applyMove.
   * @param fen the position to inspect
   * @returns the side to move and whether the position is check, checkmate, stalemate, a draw or game over
   * @throws InvalidFenError if the FEN is not valid
   */
  getStatus(fen: string): ChessPositionStatus {
    let chess: Chess;
    try {
      chess = new Chess(fen);
    } catch (error) {
      throw new InvalidFenError();
    }
    const status: ChessPositionStatus = {
      fen: chess.fen(),
      turn: chess.turn(),
      isCheck: chess.isCheck(),
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
      isDraw: chess.isDraw(),
      isGameOver: chess.isGameOver(),
    };

    return status;
  }

  /**
   * Applies a move on top of the moves already played in a game, and returns the resulting state.
   * The whole history is replayed from the initial position, so that chess.js knows every position
   * that occurred and can detect rules that depend on the past (threefold repetition).
   * @param initial_fen the FEN the game started from (not the current position)
   * @param input the move to apply
   * @param moveHistory SAN, oldest first
   * @returns the applied move and the state of the game after it (check, checkmate, stalemate, draw, game over)
   * @throws InvalidFenError if initial_fen is not valid
   * @throws InvalidMoveHistoryError if a move in moveHistory is not legal
   * @throws IllegalMoveError if the requested move is not legal
   */
  applyMove(
    initial_fen: string,
    input: ChessMoveInput,
    moveHistory: string[],
  ): AppliedChessMove {
    let chess: Chess;
    try {
      chess = new Chess(initial_fen);
    } catch (error) {
      throw new InvalidFenError();
    }

    // through history
    for (const san of moveHistory) {
      try {
        chess.move(san);
      } catch (error) {
        throw new InvalidMoveHistoryError();
      }
    }

    let move: Move;
    try {
      move = chess.move(input);
    } catch (error) {
      throw new IllegalMoveError();
    }
    const appliedMove: AppliedChessMove = {
      from: move.from,
      to: move.to,
      san: move.san,
      uci: move.lan,
      fenAfter: chess.fen(),
      turnAfter: chess.turn(),
      isCheck: chess.isCheck(),
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
      isDraw: chess.isDraw(),
      isGameOver: chess.isGameOver(),
    };

    return appliedMove;
  }
}
