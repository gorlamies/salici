import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { DatabaseModule } from "./database/database.module";
import { GamesModule } from "./games/games.module";
import { AuthModule } from "./auth/auth.module";
import { ProfileModule } from "./profile/profile.module";

@Module({
  imports: [HealthModule, GamesModule, DatabaseModule, AuthModule, ProfileModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
