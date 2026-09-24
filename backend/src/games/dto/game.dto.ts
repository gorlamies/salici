import { ApiProperty } from "@nestjs/swagger";
import { MoveDto } from "./move.dto";

export class GameDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  state!: string;

  @ApiProperty()
  initialFen!: string;

  @ApiProperty()
  currentFen!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ nullable: true, type: Date })
  finishedAt!: Date | null;

  @ApiProperty({ nullable: true, type: String })
  whitePlayerUsername!: string | null;

  @ApiProperty({ nullable: true, type: String })
  blackPlayerUsername!: string | null;

  @ApiProperty({ type: [MoveDto] })
  moves!: MoveDto[];
}