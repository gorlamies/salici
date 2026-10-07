import { ApiProperty } from "@nestjs/swagger";
import { TimeCategory } from "../../generated/prisma/enums";

// a game as shown in the list of a profile, no moves needed
export class GameSummaryDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    state!: string;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty({ nullable: true, type: Date })
    finishedAt!: Date | null;

    @ApiProperty({ nullable: true, type: String })
    whitePlayerUsername!: string | null;

    @ApiProperty({ nullable: true, type: String })
    blackPlayerUsername!: string | null;

    // position at the end of the game (or the current one if it is not finished)
    @ApiProperty()
    currentFen!: string;

    @ApiProperty({ enum: TimeCategory, enumName: "TimeCategory" })
    timeCategory!: TimeCategory;

    @ApiProperty({ example: "3+2" })
    timeLabel!: string;

    @ApiProperty({ nullable: true, type: Number })
    whiteRatingBefore!: number | null;

    @ApiProperty({ nullable: true, type: Number })
    whiteRatingAfter!: number | null;

    @ApiProperty({ nullable: true, type: Number })
    blackRatingBefore!: number | null;

    @ApiProperty({ nullable: true, type: Number })
    blackRatingAfter!: number | null;
}

export class ProfileGamesDto {
    @ApiProperty({ type: [GameSummaryDto] })
    games!: GameSummaryDto[];

    // id to send as cursor to get the next page, null when there are no more games
    @ApiProperty({ nullable: true, type: String })
    nextCursor!: string | null;
}