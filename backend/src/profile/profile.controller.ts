import {
    BadRequestException,
    Controller,
    DefaultValuePipe,
    Get,
    Param,
    ParseEnumPipe,
    ParseIntPipe,
    Query,
    Req,
    UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiQuery } from "@nestjs/swagger";
import { ProfileService } from "./profile.service";
import { JwtAuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { ProfileDto } from "./dto/profile.dto";
import { ProfileGamesDto } from "./dto/profileGames.dto";
import { TimeCategory } from "../generated/prisma/enums";

const DEFAULT_GAMES_PER_PAGE = 10;
const MAX_GAMES_PER_PAGE = 50;

@Controller("profile")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get(":username")
    @ApiOkResponse({ type: ProfileDto })
    async getProfile(
        @Param("username") username: string,
        @Req() request: AuthenticatedRequest,
    ): Promise<ProfileDto> {
        return this.profileService.getProfile(username, request.user.sub);
    }

    @Get(":username/games")
    @ApiOkResponse({ type: ProfileGamesDto })
    @ApiQuery({ name: "cursor", required: false, type: String })
    @ApiQuery({ name: "limit", required: false, type: Number })
    @ApiQuery({ name: "category", required: false, enum: TimeCategory, enumName: "TimeCategory" })
    async getGames(
        @Param("username") username: string,
        @Query("limit", new DefaultValuePipe(DEFAULT_GAMES_PER_PAGE), ParseIntPipe) limit: number,
        @Query("category", new ParseEnumPipe(TimeCategory, { optional: true })) category?: TimeCategory,
        @Query("cursor") cursor?: string,
    ): Promise<ProfileGamesDto> {
        if (limit < 1 || limit > MAX_GAMES_PER_PAGE) {
            throw new BadRequestException(`limit must be between 1 and ${MAX_GAMES_PER_PAGE}`); // 400
        }
        return this.profileService.getGames(username, cursor, limit, category);
    }
}