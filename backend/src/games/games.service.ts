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
import type { GameModel, MoveModel } from "../generated/prisma/models";
import { GameDto } from "./dto/game.dto";
import { MoveDto } from "./dto/move.dto";

@Injectable()
export class GamesService {
  constructor(
    private readonly chessService: ChessService,
    private readonly prismaService: PrismaService,
  ) {}

  async createGame(): Promise<GameDto> {
    const fen = this.chessService.createInitialPosition();
    const game = await this.prismaService.game.create({
      data: {
        initialFen: fen,
        currentFen: fen,
      },
    });

    return this.toGameDto(game, []);
  }

  async getGame(id: number): Promise<GameDto> {
    const game = await this.prismaService.game.findUnique({
      where: { id },
      include: { moves: { orderBy: { moveNumber: "asc" } } },
    });

    if (!game) {
      throw new NotFoundException(`Game ${id} not found`);
    }

    const { moves, ...gameFields } = game;
    return this.toGameDto(gameFields, moves);
  }

  async applyMove(id: number, input: ChessMoveInput): Promise<GameDto> {
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

        const createdMove = await tx.move.create({
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

        const updatedGame = await tx.game.update({
          where: { id },
          data: {
            currentFen: applied.fenAfter,
            running: !applied.isGameOver,
            result: this.resolveResult(applied),
            finishedAt: applied.isGameOver ? new Date() : null,
          },
        });

        return this.toGameDto(updatedGame, [...previousMoves, createdMove])
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

  private toMoveDto(move: MoveModel): MoveDto {
    return {
      moveNumber: move.moveNumber,
      from: move.from,
      to: move.to,
      promotion: move.promotion,
      san: move.san,
      uci: move.uci,
      fenAfter: move.fenAfter,
      createdAt: move.createdAt,
    };
  }

  private toGameDto(game: GameModel, moves: MoveModel[]): GameDto {
    return {
      id: game.id,
      running: game.running,
      initialFen: game.initialFen,
      currentFen: game.currentFen,
      result: game.result,
      createdAt: game.createdAt,
      finishedAt: game.finishedAt,
      moves: moves.map((move) => this.toMoveDto(move)),
    };
  }
}
