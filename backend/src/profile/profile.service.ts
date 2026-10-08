import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import * as argon2 from "argon2";
import { PrismaService } from "../database/prisma.service";
import { GameState, TimeCategory } from "../generated/prisma/enums";
import { describeTimeControl } from "../clock/time-control";
import {
    DEFAULT_DEVIATION,
    DEFAULT_RATING,
    PROVISIONAL_DEVIATION,
} from "../rating/rating.constants";
import { FollowedUserDto, ProfileDto, RatingDto } from "./dto/profile.dto";
import { GamesGateway } from "../games/games.gateway";
import { GameSummaryDto, ProfileGamesDto } from "./dto/profileGames.dto";
import { EmailDto, SettingsDto } from "./dto/account.dto";

@Injectable()
export class ProfileService {

    constructor(
        private readonly prismaService: PrismaService,
        private readonly gamesGateway: GamesGateway,
    ) { }

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

        const follow = isOwner
            ? null
            : await this.prismaService.follow.findUnique({
                where: {
                    followerUsername_followedUsername: {
                        followerUsername: viewerUsername,
                        followedUsername: username,
                    },
                },
                select: { createdAt: true },
            });

        return {
            username: user.username,
            createdAt: user.createdAt,
            closedAt: user.closedAt,
            ratings,
            ongoingGameId: ongoingGame?.id ?? null,
            followedByMe: follow !== null,
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
            // start after the last game already sent
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

    async changePassword(username: string, currentPassword: string, newPassword: string): Promise<void> {
        await this.checkPassword(username, currentPassword);
        await this.prismaService.user.update({
            where: { username },
            data: { passwordhash: await argon2.hash(newPassword) },
        });
    }

    async changeEmail(username: string, currentPassword: string, newEmail: string): Promise<EmailDto> {
        await this.checkPassword(username, currentPassword);
        try {
            const user = await this.prismaService.user.update({
                where: { username },
                data: { email: newEmail },
                select: { email: true },
            });
            return { email: user.email };
        } catch (error) {
            // P2002: the unique constraint on the email failed
            if ((error as { code?: string })?.code === "P2002") {
                throw new ConflictException("Email already in use"); // 409
            }
            throw error;
        }
    }

    async updateSettings(username: string, hideOnlineStatus: boolean): Promise<SettingsDto> {
        const user = await this.prismaService.user.update({
            where: { username },
            data: { hideOnlineStatus },
            select: { hideOnlineStatus: true },
        });
        // the followers see the change
        await this.gamesGateway.notifyOnlineStatusVisibility(username, user.hideOnlineStatus);
        return { hideOnlineStatus: user.hideOnlineStatus };
    }

    async follow(followerUsername: string, followedUsername: string): Promise<void> {
        if (followerUsername === followedUsername) {
            throw new BadRequestException("You cannot follow yourself"); // 400
        }

        const followed = await this.prismaService.user.findUnique({
            where: { username: followedUsername },
            select: { closedAt: true },
        });
        if (!followed || followed.closedAt !== null) {
            throw new NotFoundException("User not found"); // 404
        }

        await this.prismaService.follow.upsert({
            where: {
                followerUsername_followedUsername: { followerUsername, followedUsername },
            },
            create: { followerUsername, followedUsername },
            update: {},
        });
    }

    async unfollow(followerUsername: string, followedUsername: string): Promise<void> {
        await this.prismaService.follow.deleteMany({
            where: { followerUsername, followedUsername },
        });
    }

    // the users followed by the logged user, online first, closed accounts skipped
    async getFollowing(username: string): Promise<FollowedUserDto[]> {
        const follows = await this.prismaService.follow.findMany({
            where: { followerUsername: username },
            select: {
                followed: {
                    select: { username: true, closedAt: true, hideOnlineStatus: true },
                },
            },
        });

        const users = follows
            .map((follow) => follow.followed)
            .filter((user) => user.closedAt === null);

        // hides users who want to stay hidden
        const online = await this.gamesGateway.findOnline(
            users.filter((user) => !user.hideOnlineStatus).map((user) => user.username),
        );

        return users
            .map((user) => ({ username: user.username, online: online.has(user.username) }))
            .sort((a, b) => Number(b.online) - Number(a.online) || a.username.localeCompare(b.username));
    }

    async closeAccount(username: string, currentPassword: string): Promise<void> {
        await this.checkPassword(username, currentPassword);
        await this.prismaService.user.update({
            where: { username },
            data: { closedAt: new Date() },
        });
    }

    private async checkPassword(username: string, password: string): Promise<void> {
        const user = await this.prismaService.user.findUnique({
            where: { username },
            select: { passwordhash: true, closedAt: true },
        });

        if (!user || user.closedAt !== null || !(await argon2.verify(user.passwordhash, password))) {
            throw new ForbiddenException("Wrong password"); // 403
        }
    }
}