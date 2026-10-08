import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { RatingService } from "./rating.service";

@Module({
    imports: [DatabaseModule],
    providers: [RatingService],
    exports: [RatingService],
})
export class RatingModule { }