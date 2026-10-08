import { ApiProperty } from "@nestjs/swagger";
import { TimeCategory } from "../../generated/prisma/enums";

export class RatingDto {
    @ApiProperty({ enum: TimeCategory, enumName: "TimeCategory" })
    timeCategory!: TimeCategory;

    // rounded as it is shown to the users
    @ApiProperty()
    rating!: number;

    @ApiProperty()
    provisional!: boolean; // 1500?
}

export class ProfileDto {
    @ApiProperty()
    username!: string;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty({ nullable: true, type: Date })
    closedAt!: Date | null;

    // one rating for each time category, always in the same order
    @ApiProperty({ type: [RatingDto] })
    ratings!: RatingDto[];

    @ApiProperty({ nullable: true, type: String })
    ongoingGameId!: string | null;

    // true if the logged user follows this user, self false
    @ApiProperty()
    followedByMe!: boolean;

    @ApiProperty({ required: false })
    email?: string;

    @ApiProperty({ required: false })
    hideOnlineStatus?: boolean;
}

export class FollowedUserDto {
    @ApiProperty()
    username!: string;

    @ApiProperty()
    online!: boolean;
}