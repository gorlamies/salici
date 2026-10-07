import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { GameState, TimeCategory } from "../generated/prisma/enums";
import { describeTimeControl } from "../clock/time-control";
import {
    DEFAULT_DEVIATION,
    DEFAULT_RATING,
    PROVISIONAL_DEVIATION,
} from "../rating/rating.constants";
import { ProfileDto, RatingDto } from "./dto/profile.dto";
import { GameSummaryDto, ProfileGamesDto } from "./dto/profileGames.dto";

@Injectable()
export class ProfileService {

    constructor(private readonly prismaService: PrismaService) { }

    /**
     * Returns the profile of a user. Private fields are included only for the owner.
     * @param username the user of the profile
     * @param viewerUsername the logged user who is looking at the profile
     */
    async getProfile(username: string, viewerUsername: string): Promise<ProfileDto> {
        const user = await this.prismaService.user.findUnique({
            where: { username },
            select: {
                username: true,
                email: true,
                createdAt: true,
                closedAt: true,
                hideOnlineStatus: true,
                ratings: {
                    select: { timeCategory: true, rating: true, deviation: true },
                },
            },
        });

        if (!user) {
            throw new NotFoundException("User not found"); // 404
        }

        // a category without a row has never been played: default values
        const ratings: RatingDto[] = Object.values(TimeCategory).map((timeCategory) => {
            const stored = user.ratings.find((rating) => rating.timeCategory === timeCategory);
            const rating = stored?.rating ?? DEFAULT_RATING;
            const deviation = stored?.deviation ?? DEFAULT_DEVIATION;
            return {
                timeCategory,
                rating: Math.round(rating),
                provisional: deviation > PROVISIONAL_DEVIATION,
            };
        });

        const ongoingGame = await this.prismaService.game.findFirst({
            where: {
                OR: [
                    { whitePlayerUsername: username },
                    { blackPlayerUsername: username },
                ],
                state: { in: [GameState.ready, GameState.running] },
            },
            orderBy: { createdAt: "desc" },
            select: { id: true },
        });

        const isOwner = viewerUsername === username;

        return {
            username: user.username,
            createdAt: user.createdAt,
            closedAt: user.closedAt,
            ratings,
            ongoingGameId: ongoingGame?.id ?? null,
            ...(isOwner && {
                email: user.email,
                hideOnlineStatus: user.hideOnlineStatus,
            }),
        };
    }

    /**
     * Returns one page of the games of a user, from the most recent.
     * @param username the player
     * @param cursor id of the last game of the previous page, undefined for the first page
     * @param limit maximum number of games of the page
     * @param timeCategory if given, only the games of this category
     */
    async getGames(
        username: string,
        cursor: string | undefined,
        limit: number,
        timeCategory: TimeCategory | undefined,
    ): Promise<ProfileGamesDto> {
        const user = await this.prismaService.user.findUnique({
            where: { username },
            select: { username: true },
        });

        if (!user) {
            throw new NotFoundException("User not found"); // 404
        }

        // if it arrives there is another page
        const games = await this.prismaService.game.findMany({
            where: {
                OR: [
                    { whitePlayerUsername: username },
                    { blackPlayerUsername: username },
                ],
                ...(timeCategory !== undefined && { timeCategory }),
            },
            // id breaks the ties between games created in the same instant
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: limit + 1,
            // the bookmark: start after the last game already sent
            ...(cursor !== undefined && { cursor: { id: cursor }, skip: 1 }),
            select: {
                id: true,
                state: true,
                createdAt: true,
                finishedAt: true,
                whitePlayerUsername: true,
                blackPlayerUsername: true,
                currentFen: true,
                initialTimeMs: true,
                incrementMs: true,
                timeCategory: true,
                whiteRatingBefore: true,
                whiteRatingAfter: true,
                blackRatingBefore: true,
                blackRatingAfter: true,
            },
        });

        const hasMore = games.length > limit;
        const page = games.slice(0, limit);

        const summaries: GameSummaryDto[] = page.map(({ initialTimeMs, incrementMs, ...game }) => ({
            ...game,
            timeLabel: describeTimeControl(initialTimeMs, incrementMs).timeLabel,
        }));

        return {
            games: summaries,
            nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
        };
    }
}