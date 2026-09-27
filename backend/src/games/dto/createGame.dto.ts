import { ApiProperty } from "@nestjs/swagger";

export class CreateGameDto {
    @ApiProperty()
    playerOneUsername!: string
    @ApiProperty()
    playerTwoUsername!: string;

}