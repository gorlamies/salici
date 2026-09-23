import { ApiProperty } from "@nestjs/swagger";

export class MoveDto {
  @ApiProperty()
  moveNumber!: number;

  @ApiProperty()
  from!: string;

  @ApiProperty()
  to!: string;

  @ApiProperty({ nullable: true, type: String })
  promotion!: string | null;

  @ApiProperty()
  san!: string;

  @ApiProperty()
  uci!: string;

  @ApiProperty()
  fenAfter!: string;

  @ApiProperty()
  createdAt!: Date;
}