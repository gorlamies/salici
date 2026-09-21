import { BadRequestException, UnauthorizedException, Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import * as argon2 from 'argon2';
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
    constructor(private readonly prismaService: PrismaService,
        private readonly jwtService: JwtService) { }

    async signup(dto: SignupDto) {
        try {
            const hashedPassword = await argon2.hash(dto.password);
            await this.prismaService.user.create({
                data: {
                    username: dto.username,
                    email: dto.email,
                    passwordhash: hashedPassword
                }
            })
        } catch (error) {
            throw new BadRequestException('Unable to create user');
        }
    }

    async login(dto: LoginDto) {
        const user = await this.prismaService.user.findUnique({
            where: {
                username: dto.username
            }
        })

        if (!user) {
            console.log("error here")
            throw new UnauthorizedException('Invalid username or password');
        }

        const passwordMatches = await argon2.verify(
            user.passwordhash,
            dto.password
        );

        if (!passwordMatches) {
            console.log("error here")
            throw new UnauthorizedException('Invalid username or password');
        }

        const accessToken = await this.jwtService.signAsync(
            {
                sub: dto.username, // better than dto.username
            },
            {
                secret: process.env.JWT_ACCESS_SECRET!,
                expiresIn: '15m',
            },
        );

        const refreshToken = await this.jwtService.signAsync(
            {
                sub: dto.username,
            },
            {
                secret: process.env.JWT_REFRESH_SECRET!,
                expiresIn: '2d',
            },
        );

        return {
            accessToken,
            refreshToken,
        };

    }

    async refresh(refreshToken: string) {
        let payload;

        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET!,
            });
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const username = payload.sub;
        const accessToken = await this.jwtService.signAsync(
            {
                sub: username, // better than dto.username
            },
            {
                secret: process.env.JWT_ACCESS_SECRET!,
                expiresIn: '15m',
            },
        );

        const now = Math.floor(Date.now() / 1000);
        const remainingTtl = payload.exp - now;
        const refreshThreshold = 24 * 60 * 60; // 1 day

        if (remainingTtl < refreshThreshold) {
            const newRefreshToken = await this.jwtService.signAsync(
                {
                    sub: username,
                },
                {
                    secret: process.env.JWT_REFRESH_SECRET!,
                    expiresIn: '2d',
                },
            );

            return {
                accessToken,
                refreshToken: newRefreshToken,
            };
        }

        return {
            accessToken,
            refreshToken: null
        };



    }
}



