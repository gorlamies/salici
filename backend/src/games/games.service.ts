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
import { CreateGameResponseDto } from "./dto/createGameResponse.dto";
import { randomInt } from "crypto";
import { GameState } from "../generated/prisma/enums";
import { ClockService } from "../clock/clock.service";

const MAX_INITIAL_TIME_MS = 180 * 60 * 1000
const MAX_INCREMENT_MS = 180 * 1000

@Injectable()
export class GamesService {
  constructor(
    private readonly chessService: ChessService,
    private readonly prismaService: PrismaService,
    private readonly clockService: ClockService,
  ) { }

  async createGame(
    body: CreateGameDto,
    creatorUsername: string,
  ): Promise<CreateGameResponseDto> {
    if (
      creatorUsername !== body.playerOneUsername &&
      creatorUsername !== body.playerTwoUsername
    ) {
      throw new ForbiddenException("You can only create a game you play in"); // 403
    }

    if (body.playerOneUsername === body.playerTwoUsername) {
      throw new BadRequestException("The two players must be different"); // 400
    }
    const fen = this.chessService.createInitialPosition();

    const users = await this.prismaService.user.findMany({
      where: {
        username: {
          in: [body.playerOneUsername, body.playerTwoUsername],
        },
      },
    });

    if (users.length !== 2)
      throw new BadRequestException("One or both players do not exist");

    const playerOneIsWhite = randomInt(2) === 0;

    const initialTimeMs = body.initialTimeMs ?? null;
    const incrementMs = body.incrementMs ?? null;

    if ((initialTimeMs !== null && incrementMs === null) || (initialTimeMs === null && incrementMs !== null))
      throw new BadRequestException("Both time controls needed");
    if (initialTimeMs !== null && incrementMs !== null) {
      if (!Number.isInteger(initialTimeMs) || !Number.isInteger(incrementMs) || (incrementMs === 0 && initialTimeMs === 0))
        throw new BadRequestException("Invalid time controls");
      if (initialTimeMs > MAX_INITIAL_TIME_MS || initialTimeMs < 0 || incrementMs > MAX_INCREMENT_MS || incrementMs < 0)
        throw new BadRequestException("One or both time controls exceed the limits");
    }

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
        initialTimeMs: initialTimeMs,
        incrementMs: incrementMs,
        turnStartedAt: initialTimeMs !== null ? new Date() : null,
        whiteRemainingMs: initialTimeMs === 0 ? incrementMs : initialTimeMs,
        blackRemainingMs: initialTimeMs === 0 ? incrementMs : initialTimeMs,
      },
    });

    return { gameId: game.id };
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

  /**
   * Finds the ready or running games for the given user.
   * @param username the username of the player to search for
   * @returns the list of games
   */
  async getOpenGames(username: string): Promise<GameDto[]> {
    const games = await this.prismaService.game.findMany({
      where: {
        OR: [
          { whitePlayerUsername: username },
          { blackPlayerUsername: username },
        ],
        state: {
          in: ["ready", "running"],
        }
      },
      orderBy: {
        createdAt: "desc",
      },
      include: { moves: { orderBy: { moveNumber: "asc" } } },
    });

    return games.map(({ moves, ...gameFields }) =>
      this.toGameDto(gameFields, moves),
    );
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
        const now = new Date();
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

        const whiteToMove: boolean = game.currentFen.split(" ")[1] === "w";
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

        // clock: null for games without a clock
        let newRemainingMs: number | null = null;
        const hasClock =
          game.initialTimeMs !== null &&
          game.incrementMs !== null &&
          game.whiteRemainingMs !== null &&
          game.blackRemainingMs !== null &&
          game.turnStartedAt !== null;

        if (hasClock) {
          const moverRemainingMs = whiteToMove
            ? game.whiteRemainingMs!
            : game.blackRemainingMs!;
          const isReadyPhase = game.state === GameState.ready;

          const msBeforeEvent = this.clockService.msLeftBeforeEvent(
            moverRemainingMs,
            now.getTime(),
            game.turnStartedAt!.getTime(),
            game.initialTimeMs!,
            game.incrementMs!,
            isReadyPhase,
          );

          // time is over: move is not applied
          if (msBeforeEvent <= 0) {
            const finishedGame = await tx.game.update({
              where: { id },
              data: {
                state: isReadyPhase
                  ? GameState.aborted
                  : whiteToMove
                    ? GameState.white_timeout
                    : GameState.black_timeout,
                finishedAt: now,
                ...(!isReadyPhase && (whiteToMove
                  ? { whiteRemainingMs: 0 }
                  : { blackRemainingMs: 0 })),
              },
            });
            return this.toGameDto(finishedGame, previousMoves);
          }

          newRemainingMs = this.clockService.msLeftAfterMove(
            moverRemainingMs,
            now.getTime(),
            game.turnStartedAt!.getTime(),
            game.incrementMs!,
            isReadyPhase,
          );
        }

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
            remainingMsAfter: newRemainingMs,
          },
        });

        const updatedGame = await tx.game.update({
          where: { id },
          data: {
            currentFen: applied.fenAfter,
            state: this.resolveState(applied),
            finishedAt: applied.isGameOver ? now : null,
            // update the mover time the opponent's turn starts now
            ...(hasClock && {
              whiteRemainingMs: whiteToMove ? newRemainingMs : game.whiteRemainingMs,
              blackRemainingMs: whiteToMove ? game.blackRemainingMs : newRemainingMs,
              turnStartedAt: now,
            }),
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

  async resign(id: string, resignUsername: string): Promise<GameDto> {
    const game = await this.prismaService.game.findUnique({
      where: { id },
    });

    if (!game) {
      throw new NotFoundException("Game not found");
    }

    let newState: GameState;

    if (game.whitePlayerUsername === resignUsername) {
      newState = GameState.white_resigned;
    } else if (game.blackPlayerUsername === resignUsername) {
      newState = GameState.black_resigned;
    } else {
      throw new ForbiddenException("User is not a player in this game"); // 403
    }

    const result = await this.prismaService.game.updateMany({
      where: { id, state: { in: [GameState.ready, GameState.running] } },
      data: {
        state: newState,
        finishedAt: new Date(),
        turnStartedAt: null,
      },
    });

    if (result.count === 0)
      throw new ConflictException("The game is not running."); // 409

    const updatedGame = this.getGame(id);
    return updatedGame;

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
    if (Number(applied.fenAfter.split(" ")[5]) === 1) // if move 1
      return GameState.ready;
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
      remainingMsAfter: move.remainingMsAfter,
    };
  }

  private toGameDto(
    game: GameModel,
    moves: MoveModel[] = [],
  ): GameDto {
    let whiteRemainingMs = game.whiteRemainingMs;
    let blackRemainingMs = game.blackRemainingMs;

    // time left to the side to move for its first move
    let firstMoveRemainingMs: number | null = null;
    if (
      game.state === GameState.ready &&
      game.turnStartedAt !== null &&
      game.initialTimeMs !== null &&
      game.incrementMs !== null
    ) {
      firstMoveRemainingMs = Math.max(
        0,
        game.turnStartedAt.getTime() +
        this.clockService.firstMoveAllowedMs(game.initialTimeMs, game.incrementMs) -
        Date.now(),
      );
    }

    // during the game the clock of the side to move is running: send its value
    if (
      game.state === GameState.running &&
      game.turnStartedAt !== null &&
      whiteRemainingMs !== null &&
      blackRemainingMs !== null
    ) {
      const now = Date.now();
      const turnStartedAt = game.turnStartedAt.getTime();
      if (this.chessService.getStatus(game.currentFen).turn === "w") {
        whiteRemainingMs = this.clockService.remainingTime(whiteRemainingMs, now, turnStartedAt);
      } else {
        blackRemainingMs = this.clockService.remainingTime(blackRemainingMs, now, turnStartedAt);
      }
    }

    return {
      id: game.id,
      state: game.state,
      initialFen: game.initialFen,
      currentFen: game.currentFen,
      whitePlayerUsername: game.whitePlayerUsername,
      blackPlayerUsername: game.blackPlayerUsername,
      createdAt: game.createdAt,
      finishedAt: game.finishedAt,
      initialTimeMs: game.initialTimeMs,
      incrementMs: game.incrementMs,
      whiteRemainingMs,
      blackRemainingMs,
      firstMoveRemainingMs,
      moves: moves.map((move) => this.toMoveDto(move)),
    };
  }
}
