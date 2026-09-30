import { ApiProperty } from "@nestjs/swagger";

export class CreateGameResponseDto {
    @ApiProperty()
    gameId!: string
}