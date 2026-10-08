import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "../generated/prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient<{
    omit: {
      user: {
        passwordhash: true;
      };
    };
  }>
  implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      omit: {
        user: {
          passwordhash: true,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}