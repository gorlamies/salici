import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { GamesGateway } from './games.gateway';
import { GameState } from '../generated/prisma/enums';
import { GamesService } from './games.service';
import { ClockService } from '../clock/clock.service';
import { RatingService } from '../rating/rating.service';

@Injectable()
export class GameTimeoutService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly gamesGateway: GamesGateway,
        private readonly gamesService: GamesService,
        private readonly clockService: ClockService,
        private readonly ratingService: RatingService,
    ) { }

    @Cron('* * * * * *', {
        waitForCompletion: true,
    })
    async checkExpiredGames() {
        const now = new Date();

        // games with a clock in ready phase or running
        const activeGames = await this.prisma.game.findMany({
            where: {
                state: {
                    in: [GameState.ready, GameState.running],
                },
                turnStartedAt: {
                    not: null,
                },
            },
            select: {
                id: true,
                state: true,
                currentFen: true,
                turnStartedAt: true,
                initialTimeMs: true,
                incrementMs: true,
                whiteRemainingMs: true,
                blackRemainingMs: true,
            },
        });

        for (const game of activeGames) {
            if (
                game.turnStartedAt === null ||
                game.whiteRemainingMs === null ||
                game.blackRemainingMs === null ||
                game.initialTimeMs === null ||
                game.incrementMs === null
            ) {
                continue;
            }

            const whiteToMove = game.currentFen.split(' ')[1] === 'w';
            const isReadyPhase = game.state === GameState.ready;

            // time left on the clock of the side to move (or the time remaining for the first move if the game is "ready")
            const msBeforeEvent = this.clockService.msLeftBeforeEvent(
                whiteToMove ? game.whiteRemainingMs : game.blackRemainingMs,
                now.getTime(),
                game.turnStartedAt.getTime(),
                game.initialTimeMs,
                game.incrementMs,
                isReadyPhase,
            );

            if (msBeforeEvent > 0) {
                continue;
            }

            const result = await this.prisma.game.updateMany({
                where: {
                    id: game.id,
                    state: game.state,
                    turnStartedAt: game.turnStartedAt,
                    finishedAt: null,
                },
                data: isReadyPhase
                    ? {
                        state: GameState.aborted, // first move not played in time
                        finishedAt: now,
                    }
                    : {
                        state: whiteToMove
                            ? GameState.white_timeout
                            : GameState.black_timeout,
                        finishedAt: now,
                        ...(whiteToMove
                            ? { whiteRemainingMs: 0 }
                            : { blackRemainingMs: 0 }),
                    },
            });

            if (result.count === 0) {
                continue;
            }

            // a time out counts for the ratings (aborted game is ignored by rateGame)
            await this.ratingService.rateGame(game.id);

            const updatedGame =
                await this.gamesService.getGame(game.id);

            this.gamesGateway.notifyGameState(
                game.id,
                updatedGame,
            );
        }
    }
}