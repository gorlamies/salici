import {
    BadRequestException,
    Body,
    Controller,
    DefaultValuePipe,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    ParseEnumPipe,
    ParseIntPipe,
    Query,
    Req,
    Res,
    UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { ApiBearerAuth, ApiOkResponse, ApiQuery } from "@nestjs/swagger";
import { ProfileService } from "./profile.service";
import { JwtAuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { ProfileDto } from "./dto/profile.dto";
import { ProfileGamesDto } from "./dto/profileGames.dto";
import { TimeCategory } from "../generated/prisma/enums";
import {
    ChangeEmailDto,
    ChangePasswordDto,
    CloseAccountDto,
    EmailDto,
    SettingsDto,
} from "./dto/account.dto";

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

    @Patch("me/password")
    @HttpCode(204)
    async changePassword(
        @Body() body: ChangePasswordDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<void> {
        await this.profileService.changePassword(request.user.sub, body.currentPassword, body.newPassword);
    }

    @Patch("me/email")
    @ApiOkResponse({ type: EmailDto })
    async changeEmail(
        @Body() body: ChangeEmailDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<EmailDto> {
        return this.profileService.changeEmail(request.user.sub, body.currentPassword, body.newEmail);
    }

    @Patch("me/settings")
    @ApiOkResponse({ type: SettingsDto })
    async updateSettings(
        @Body() body: SettingsDto,
        @Req() request: AuthenticatedRequest,
    ): Promise<SettingsDto> {
        return this.profileService.updateSettings(request.user.sub, body.hideOnlineStatus);
    }

    @Post("me/close")
    @HttpCode(204)
    async closeAccount(
        @Body() body: CloseAccountDto,
        @Req() request: AuthenticatedRequest,
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        await this.profileService.closeAccount(request.user.sub, body.currentPassword);
        // same options as POST /auth/logout
        response.clearCookie("refresh_token", {
            httpOnly: true,
            sameSite: "lax",
            secure: false, // true in production with HTTPS
            path: "/",
        });
    }
}