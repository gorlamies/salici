import { Body, Controller, Get, Post, Param, ParseIntPipe, UseGuards } from "@nestjs/common";
import { GamesService } from "./games.service";
import { ChessMoveInput } from "../chess/chess.types";
import { ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.guard";


@Controller("games")
export class GamesController {
  constructor(private readonly gamesService: GamesService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createGame() {
    return this.gamesService.createGame();
  }

  @Get(":id")
  getGame(@Param("id", ParseIntPipe) id: number) {
    return this.gamesService.getGame(id);
  }

  @ApiBody({
    schema: {
      type: "object",
      required: ["from", "to"],
      properties: {
        from: { type: "string", example: "e2" },
        to: { type: "string", example: "e4" },
        promotion: { type: "string", enum: ["q", "r", "b", "n"], nullable: true },
      },
    },
  })
  @Post(":id/moves")
  applyMove(
    @Param("id", ParseIntPipe) id: number,
    @Body() input: ChessMoveInput,
  ) {
    return this.gamesService.applyMove(id, input);
  }
}