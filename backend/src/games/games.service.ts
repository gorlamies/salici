import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ChessService } from "../chess/chess.service";
import { PrismaService } from "../database/prisma.service";
import { ChessMoveInput, AppliedChessMove } from "../chess/chess.types";
import { IllegalMoveError } from "../chess/chess.errors";

@Injectable()
export class GamesService {
  constructor(
    private readonly chessService: ChessService,
    private readonly prismaService: PrismaService,
  ) {}

  async createGame() {
    const fen = this.chessService.createInitialPosition();
    return this.prismaService.game.create({
      data: {
        initialFen: fen,
        currentFen: fen,
      },
    });
  }

  async getGame(id: number) {
    const game = await this.prismaService.game.findUnique({ where: { id } });

    if (!game) {
      throw new NotFoundException(`Game ${id} not found`);
    }

    return game;
  }

  async applyMove(id: number, input: ChessMoveInput) {
    if (!input?.from || !input?.to) {
      throw new BadRequestException("Both 'from' and 'to' are required.");
    }

    try {
      return await this.prismaService.$transaction(async (tx) => {
        const game = await tx.game.findUnique({ where: { id } });

        if (!game) {
          throw new NotFoundException(`Game ${id} not found`);
        }

        if (!game.running) {
          throw new ConflictException("The game is already finished.");
        }

        // the full history is needed to detect rules that depend on the past (threefold repetition), so the game is replayed from its first position.
        const previousMoves = await tx.move.findMany({
          where: { gameId: id },
          orderBy: { moveNumber: "asc" },
          select: { san: true },
        });

        let applied: AppliedChessMove;
        try {
          applied = this.chessService.applyMove(game.initialFen, input, previousMoves.map((previousMove) => previousMove.san));
        } catch (error) {
          if (error instanceof IllegalMoveError) {
            throw new ConflictException(error.message);
          }
          throw error;
        }

        const moveNumber = previousMoves.length + 1;

        await tx.move.create({
          data: {
            gameId: id,
            moveNumber,
            from: applied.from,
            to: applied.to,
            promotion: input.promotion ?? null,
            san: applied.san,
            uci: applied.uci,
            fenAfter: applied.fenAfter,
          },
        });

        return tx.game.update({
          where: { id },
          data: {
            currentFen: applied.fenAfter,
            running: !applied.isGameOver,
            result: this.resolveResult(applied),
            finishedAt: applied.isGameOver ? new Date() : null,
          },
        });
      });
    } catch (error) {
      if ((error as { code?: string })?.code === "P2002") {
        throw new ConflictException(
          "The game state changed while applying this move. Please retry.",
        );
      }
      throw error;
    }
  }

  private resolveResult(applied: AppliedChessMove): string | null {
    if (applied.isCheckmate) {
      return applied.turnAfter === "b" ? "white_win" : "black_win";
    }
    if (applied.isDraw) {
      return "draw";
    }
    return null;
  }
}
