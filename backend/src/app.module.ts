import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { DatabaseModule } from "./database/database.module";
import { GamesModule } from "./games/games.module";
import { AuthModule } from "./auth/auth.module";
import { ProfileModule } from "./profile/profile.module";
import { ScheduleModule } from '@nestjs/schedule';


@Module({
  imports: [HealthModule, GamesModule, DatabaseModule, AuthModule, ProfileModule, ScheduleModule.forRoot(),],
  controllers: [],
  providers: [],
})
export class AppModule { }
