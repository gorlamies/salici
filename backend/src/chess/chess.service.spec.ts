import { ChessService } from "./chess.service";
import { InvalidFenError, IllegalMoveError } from "./chess.errors";

describe("ChessService", () => {
  let chessService: ChessService;

  beforeEach(() => {
    chessService = new ChessService();
  });

  describe("createInitialPosition", () => {
    test("returns the standard starting position FEN", () => {
      const fen = chessService.createInitialPosition();
      expect(fen).toBe(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      );
    });
  });

  describe("getStatus", () => {
    test("correct status on the starting position", () => {
      const fen = chessService.createInitialPosition();
      const status = chessService.getStatus(fen);

      expect(status.turn).toBe("w");
      expect(status.isCheck).toBe(false);
      expect(status.isCheckmate).toBe(false);
      expect(status.isGameOver).toBe(false);
    });

    test("throws InvalidFenError for a bad FEN", () => {
      expect(() => chessService.getStatus("bad FEN")).toThrow(InvalidFenError);
    });

    test("detects checkmate", () => {
      // 1. f3 e5 2. g4 Qh4#
      const fen =
        "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";
      const status = chessService.getStatus(fen);

      expect(status.isCheck).toBe(true);
      expect(status.isCheckmate).toBe(true);
      expect(status.isGameOver).toBe(true);
    });

    test("detects stalemate", () => {
      // black king on a8, white king c7, white queen b6
      const fen = "k7/2K5/1Q6/8/8/8/8/8 b - - 0 1";
      const status = chessService.getStatus(fen);

      expect(status.isCheck).toBe(false);
      expect(status.isStalemate).toBe(true);
      expect(status.isGameOver).toBe(true);
    });

    test("detects a draw by insufficient material", () => {
      // only two kings
      const fen = "8/8/4k3/8/8/4K3/8/8 w - - 0 1";
      const status = chessService.getStatus(fen);

      expect(status.isCheckmate).toBe(false);
      expect(status.isStalemate).toBe(false);
      expect(status.isDraw).toBe(true);
      expect(status.isGameOver).toBe(true);
    });

    test("detects a draw by the fifty-move rule", () => {
      // halfmove clock at 100 = 50 full moves without a capture or pawn move
      const fen = "4k3/8/8/8/8/8/8/4K3 w - - 100 60";
      const status = chessService.getStatus(fen);

      expect(status.isDraw).toBe(true);
      expect(status.isGameOver).toBe(true);
    });

    test("detects a draw by threefold repetition", () => {
      let fen = chessService.createInitialPosition();

      fen = chessService.applyMove(fen, { from: "g1", to: "f3" }).fenAfter;
      fen = chessService.applyMove(fen, { from: "g8", to: "f6" }).fenAfter;
      fen = chessService.applyMove(fen, { from: "f3", to: "g1" }).fenAfter;
      fen = chessService.applyMove(fen, { from: "f6", to: "g8" }).fenAfter;
      // second occurrence

      fen = chessService.applyMove(fen, { from: "g1", to: "f3" }).fenAfter;
      fen = chessService.applyMove(fen, { from: "g8", to: "f6" }).fenAfter;
      fen = chessService.applyMove(fen, { from: "f3", to: "g1" }).fenAfter;
      const result = chessService.applyMove(fen, { from: "f6", to: "g8" });
      // third occurrence: this should be a draw

      expect(result.isDraw).toBe(true);
      expect(result.isGameOver).toBe(true);
    });
  });

  describe("applyMove", () => {
    test("applies a legal pawn move and returns the resulting state", () => {
      const fen = chessService.createInitialPosition();
      const result = chessService.applyMove(fen, { from: "d2", to: "d4" });

      expect(result.san).toBe("d4");
      expect(result.turnAfter).toBe("b");
      expect(result.fenAfter).toBe(
        "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1",
      );
    });

    test("applies a capture", () => {
      // white pawn e4, black pawn d5, white to move: exd5
      const fen = "4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1";
      const result = chessService.applyMove(fen, { from: "e4", to: "d5" });

      expect(result.san).toBe("exd5");
      expect(result.turnAfter).toBe("b");
    });

    test("applies kingside castling", () => {
      const fen = "4k3/8/8/8/8/8/8/4K2R w K - 0 1";
      const result = chessService.applyMove(fen, { from: "e1", to: "g1" });

      expect(result.san).toBe("O-O");
      expect(result.to).toBe("g1");
      expect(result.turnAfter).toBe("b");
    });

    test("applies an en passant capture", () => {
      const fen = "4k3/8/8/8/3pP3/8/8/4K3 b - e3 0 1";
      const result = chessService.applyMove(fen, { from: "d4", to: "e3" });

      expect(result.san).toBe("dxe3");
      expect(result.to).toBe("e3");
      expect(result.turnAfter).toBe("w");
    });

    test("applies a pawn promotion", () => {
      const fen = "7k/P7/8/8/8/8/8/K7 w - - 0 1";
      const result = chessService.applyMove(fen, {
        from: "a7",
        to: "a8",
        promotion: "n",
      });

      expect(result.san).toBe("a8=N");
      expect(result.to).toBe("a8");
      expect(result.turnAfter).toBe("b");
    });

    test("throws IllegalMoveError for a move that breaks chess rules", () => {
      const fen = chessService.createInitialPosition();
      expect(() =>
        chessService.applyMove(fen, { from: "d1", to: "e8" }),
      ).toThrow(IllegalMoveError);
    });
  });
});
