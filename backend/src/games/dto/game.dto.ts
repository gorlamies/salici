import { ApiProperty } from "@nestjs/swagger";
import { MoveDto } from "./move.dto";

export class GameDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  running!: boolean;

  @ApiProperty()
  initialFen!: string;

  @ApiProperty()
  currentFen!: string;

  @ApiProperty({ nullable: true, type: String })
  result!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ nullable: true, type: Date })
  finishedAt!: Date | null;

  @ApiProperty({ type: [MoveDto] })
  moves!: MoveDto[];
}