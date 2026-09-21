import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { DatabaseModule } from "./database/database.module";
import { GamesModule } from "./games/games.module";
import { MiddlewareConsumer, NestModule } from "@nestjs/common";
import { LoggerMiddleware } from "./common/middleware/logger.middleware";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [HealthModule, GamesModule, DatabaseModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
