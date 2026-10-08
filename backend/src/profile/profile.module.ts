import { Module } from "@nestjs/common";
import { ProfileService } from "./profile.service";
import { DatabaseModule } from '../database/database.module';
import { ProfileController } from "./profile.controller";
import { AuthModule } from "../auth/auth.module";
import { GamesModule } from "../games/games.module";

@Module({
    imports: [DatabaseModule, AuthModule, GamesModule],
    controllers: [ProfileController],
    providers: [ProfileService]

})

export class ProfileModule { }