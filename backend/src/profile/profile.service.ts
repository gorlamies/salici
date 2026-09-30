import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class ProfileService {

    constructor(private readonly prismaService: PrismaService) { }

    async getInfo(userId: string) {
        return this.prismaService.user.findUnique({
            where: {
                username: userId,
            },
            select: {
                username: true,
                email: true,
            },
        });
    }



}

