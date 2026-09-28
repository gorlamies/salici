import { Module } from "@nestjs/common";
import { ProfileService } from "./profile.service";
import { DatabaseModule } from '../database/database.module';
import { ProfileController } from "./profile.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
    imports: [DatabaseModule, AuthModule],
    controllers: [ProfileController],
    providers: [ProfileService]

})

export class ProfileModule { }