import { Controller, Get, UseGuards, Param } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";
import { ProfileService } from "./profile.service";
import { JwtAuthGuard } from "../auth/auth.guard";
import { ProfileDto } from "./dto/profile.dto";

@Controller("profile")
@ApiBearerAuth()
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get(":UserId")
    @UseGuards(JwtAuthGuard)
    @ApiOkResponse({ type: ProfileDto })
    async getUserInfo(@Param("UserId") userId: string) {
        const data = await this.profileService.getInfo(userId);
        return data;
    }

}