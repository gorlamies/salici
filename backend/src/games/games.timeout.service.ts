import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { GamesGateway } from './games.gateway';
import { GameState } from '../generated/prisma/enums';
import { GamesService } from './games.service';

@Injectable()
export class GameTimeoutService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly gamesGateway: GamesGateway,
        private readonly gamesService: GamesService,

    ) { }

    @Cron('* * * * * *', {
        waitForCompletion: true,
    })
    async checkExpiredGames() {
        const now = new Date();

        const runningGames = await this.prisma.game.findMany({
            where: {
                state: GameState.running,
                turnStartedAt: {
                    not: null,
                },
            },
            select: {
                id: true,
                currentFen: true,
                turnStartedAt: true,
                whiteRemainingMs: true,
                blackRemainingMs: true,
            },
        });

        for (const game of runningGames) {
            if (
                game.turnStartedAt === null ||
                game.whiteRemainingMs === null ||
                game.blackRemainingMs === null
            ) {
                continue;
            }

            const whiteToMove = game.currentFen.split(' ')[1] === 'w';
            const activeRemainingMs = whiteToMove ? game.whiteRemainingMs : game.blackRemainingMs;
            const elapsedMs = now.getTime() - game.turnStartedAt.getTime();
            const remainingMs = activeRemainingMs - elapsedMs;

            if (remainingMs > 0) {
                continue;
            }
            const result = await this.prisma.game.updateMany({
                where: {
                    id: game.id,
                    state: GameState.running,
                    turnStartedAt: game.turnStartedAt,
                },
                data: {
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

            const updatedGame =
                await this.gamesService.getGame(game.id);

            this.gamesGateway.notifyGameState(
                game.id,
                updatedGame,
            );
        }
    }
}