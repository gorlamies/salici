import { BadRequestException, UnauthorizedException, Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import * as argon2 from 'argon2';
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
    constructor(private readonly prismaService: PrismaService) { }

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
            throw new UnauthorizedException('Invalid username or password');
        }

        const passwordMatches = await argon2.verify(
            user.passwordhash,
            dto.password
        );

        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid username or password');
        }


    }
    /*
        async login() { }
        async refresh() { }
    */

}



