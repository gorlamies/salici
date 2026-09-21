import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";
import type { Response, Request } from 'express';



@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) { }


    @Post("signup")
    async signup(
        @Body() body: SignupDto
    ) { await this.authService.signup(body) }


    @Post("login")
    async login(
        @Body() body: LoginDto,
        @Res({ passthrough: true }) response: Response
    ) {
        const { accessToken, refreshToken } = await this.authService.login(body)

        response.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: false, // true in production with HTTPS
            sameSite: 'lax',
            maxAge: 2 * 24 * 60 * 60 * 1000,
        });

        return {
            accessToken,
        };
    }

    @Post("refresh")
    async refresh(@Req() request: Request,
        @Res({ passthrough: true }) response: Response) {
        const oldRefreshToken = request.cookies['refresh_token']

        const { accessToken, refreshToken } = await this.authService.refresh(oldRefreshToken)

        if (refreshToken) {
            response.cookie('refresh_token', refreshToken, {
                httpOnly: true,
                secure: false, // true in production with HTTPS
                sameSite: 'lax',
                maxAge: 2 * 24 * 60 * 60 * 1000,
            });
        }

        return {
            accessToken,
        };
    }


}