import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { GameState, TimeCategory } from "../generated/prisma/enums";
import { updateRating, type GlickoRating } from "./glicko2";
import {
    DEFAULT_DEVIATION,
    DEFAULT_RATING,
    DEFAULT_VOLATILITY,
    MIN_DEVIATION,
    TAU,
} from "./rating.constants";

const WHITE_WINS: GameState[] = [GameState.white_win, GameState.black_resigned, GameState.black_timeout];
const BLACK_WINS: GameState[] = [GameState.black_win, GameState.white_resigned, GameState.white_timeout];
const NOT_RATED: GameState[] = [GameState.ready, GameState.running, GameState.aborted]; // states of games that are not finished or that do not count

// 1 win, 0.5 draw, 0 loss
function whiteScore(state: GameState): number {
    if (WHITE_WINS.includes(state)) return 1;
    if (BLACK_WINS.includes(state)) return 0;
    return 0.5;
}

@Injectable()
export class RatingService {

    constructor(private readonly prismaService: PrismaService) { }

    /**
     * Updates the ratings of the two players of a finished game.
     * Safe to call more than once, a game is rated only once.
     * Aborted or unfinished games are ignored.
     */
    async rateGame(gameId: string): Promise<void> {
        try {
            await this.rateGameInTransaction(gameId);
        } catch (error) {
            console.error(`Could not rate game ${gameId}`, error);
        }
    }

    private async rateGameInTransaction(gameId: string): Promise<void> {
        await this.prismaService.$transaction(async (tx) => {
            const game = await tx.game.findUnique({
                where: { id: gameId },
                select: {
                    state: true,
                    timeCategory: true,
                    whitePlayerUsername: true,
                    blackPlayerUsername: true,
                    whiteRatingAfter: true,
                },
            });

            if (
                !game ||
                NOT_RATED.includes(game.state) ||
                game.whiteRatingAfter !== null || // already rated
                game.whitePlayerUsername === null ||
                game.blackPlayerUsername === null
            ) {
                return;
            }

            const white = await this.findRating(tx, game.whitePlayerUsername, game.timeCategory);
            const black = await this.findRating(tx, game.blackPlayerUsername, game.timeCategory);

            const score = whiteScore(game.state);
            const newWhite = this.limitDeviation(updateRating(white, [{ opponent: black, score }], TAU));
            const newBlack = this.limitDeviation(updateRating(black, [{ opponent: white, score: 1 - score }], TAU));

            // claimed only if nobody rated it in the meantime
            const claimed = await tx.game.updateMany({
                where: { id: gameId, whiteRatingAfter: null },
                data: {
                    whiteRatingBefore: Math.round(white.rating),
                    whiteRatingAfter: Math.round(newWhite.rating),
                    blackRatingBefore: Math.round(black.rating),
                    blackRatingAfter: Math.round(newBlack.rating),
                },
            });
            if (claimed.count === 0) return;

            await this.saveRating(tx, game.whitePlayerUsername, game.timeCategory, newWhite);
            await this.saveRating(tx, game.blackPlayerUsername, game.timeCategory, newBlack);
        });
    }

    private async findRating(
        tx: Parameters<Parameters<PrismaService["$transaction"]>[0]>[0],
        username: string,
        timeCategory: TimeCategory,
    ): Promise<GlickoRating> {
        const stored = await tx.rating.findUnique({
            where: { username_timeCategory: { username, timeCategory } },
            select: { rating: true, deviation: true, volatility: true },
        });
        return stored ?? {
            rating: DEFAULT_RATING,
            deviation: DEFAULT_DEVIATION,
            volatility: DEFAULT_VOLATILITY,
        };
    }

    private async saveRating(
        tx: Parameters<Parameters<PrismaService["$transaction"]>[0]>[0],
        username: string,
        timeCategory: TimeCategory,
        rating: GlickoRating,
    ): Promise<void> {
        await tx.rating.upsert({
            where: { username_timeCategory: { username, timeCategory } },
            create: { username, timeCategory, ...rating },
            update: rating,
        });
    }

    private limitDeviation(rating: GlickoRating): GlickoRating {
        return {
            ...rating,
            deviation: Math.min(Math.max(rating.deviation, MIN_DEVIATION), DEFAULT_DEVIATION),
        };
    }
}