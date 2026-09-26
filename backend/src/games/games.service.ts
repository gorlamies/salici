import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import { CreateGameDto } from "./dto/createGame.dto";
import { randomInt } from "crypto";
import { GameState } from "../generated/prisma/enums";

@Injectable()
export class GamesService {
  constructor(
    private readonly chessService: ChessService,
    private readonly prismaService: PrismaService,
  ) { }

  async createGame(body: CreateGameDto): Promise<{ gameId: string }> {
    const fen = this.chessService.createInitialPosition();

    const users = await this.prismaService.user.findMany({
      where: {
        username: {
          in: [body.playerOneUsername, body.playerTwoUsername],
        },
      },
    });

    if (users.length !== 2) {
      throw new BadRequestException("One or both players do not exist");
    }

    const playerOneIsWhite = randomInt(2) === 0;

    const game = await this.prismaService.game.create({
      data: {
        initialFen: fen,
        currentFen: fen,
        whitePlayerUsername: playerOneIsWhite
          ? body.playerOneUsername
          : body.playerTwoUsername,
        blackPlayerUsername: playerOneIsWhite
          ? body.playerTwoUsername
          : body.playerOneUsername,
      },
    });

    return {
      gameId: game.id,
    };
  }

  async getGame(id: string): Promise<GameDto> {
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

  async applyMove(
    id: string,
    input: ChessMoveInput,
    mover_username: string,
  ): Promise<GameDto> {
    if (!input?.from || !input?.to) {
      throw new BadRequestException("Both 'from' and 'to' are required.");
    }

    try {
      return await this.prismaService.$transaction(async (tx) => {
        const game = await tx.game.findUnique({ where: { id } });

        if (!game) {
          throw new NotFoundException(`Game ${id} not found`);
        }

        // moves are accepted only before the first move (ready) or during the game (running)
        if (
          game.state !== GameState.ready &&
          game.state !== GameState.running
        ) {
          throw new ConflictException("The game is not running."); // 409
        }

        const whiteToMove: Boolean = game.currentFen.split(" ")[1] === "w";
        if (
          mover_username !==
          (whiteToMove ? game.whitePlayerUsername : game.blackPlayerUsername)
        ) {
          throw new ForbiddenException("Unauthorized move");
        }

        // the full history is needed to detect rules that depend on the past (threefold repetition), so the game is replayed from its first position.
        const previousMoves = await tx.move.findMany({
          where: { gameId: id },
          orderBy: { moveNumber: "asc" },
        });

        let applied: AppliedChessMove;
        try {
          applied = this.chessService.applyMove(
            game.initialFen,
            input,
            previousMoves.map((previousMove) => previousMove.san),
          );
        } catch (error) {
          if (error instanceof IllegalMoveError) {
            throw new ConflictException(error.message); // 409
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
            state: this.resolveState(applied),
            finishedAt: applied.isGameOver ? new Date() : null,
          },
        });

        return this.toGameDto(updatedGame, [...previousMoves, createdMove]);
      });
    } catch (error) {
      if ((error as { code?: string })?.code === "P2002") {
        throw new ConflictException(
          "The game state changed while applying this move. Please retry.",
        ); // 409
      }
      throw error;
    }
  }

  // state of the game after a move; checkmate > forced draw
  private resolveState(applied: AppliedChessMove): GameState {
    if (applied.isCheckmate) {
      return applied.turnAfter === "b"
        ? GameState.white_win
        : GameState.black_win;
    }
    if (applied.isStalemate) {
      return GameState.stalemate;
    }
    if (applied.isInsufficientMaterial) {
      return GameState.insufficient_material;
    }
    if (applied.isThreefoldRepetition) {
      return GameState.threefold_repetition;
    }
    if (applied.isFivefoldRepetition) {
      return GameState.fivefold_repetition;
    }
    if (applied.isDrawByFiftyMoves) {
      return GameState.fifty_move_rule;
    }
    if (applied.isDrawBySeventyfiveMoves) {
      return GameState.seventy_five_move_rule;
    }
    return GameState.running;
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
      state: game.state,
      initialFen: game.initialFen,
      currentFen: game.currentFen,
      whitePlayerUsername: game.whitePlayerUsername,
      blackPlayerUsername: game.blackPlayerUsername,
      createdAt: game.createdAt,
      finishedAt: game.finishedAt,
      moves: moves.map((move) => this.toMoveDto(move)),
    };
  }
}
