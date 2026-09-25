import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { DatabaseModule } from "./database/database.module";
import { GamesModule } from "./games/games.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [HealthModule, GamesModule, DatabaseModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
