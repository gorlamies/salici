import { ApiProperty } from "@nestjs/swagger";

export class CreateGameDto {
    @ApiProperty()
    playerOneUsername!: string
    @ApiProperty()
    playerTwoUsername!: string;
    @ApiProperty({ nullable: true, type: Number, required: false })
    initialTimeMs?: number | null;
    @ApiProperty({ nullable: true, type: Number, required: false })
    incrementMs?: number | null;
}