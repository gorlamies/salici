import { Body, Controller, Get, Post, Param, ParseIntPipe } from "@nestjs/common";
import { GamesService } from "./games.service";
import { ChessMoveInput } from "../chess/chess.types";
import { ApiBody } from "@nestjs/swagger";

@Controller("games")
export class GamesController {
  constructor(private readonly gamesService: GamesService) { }

  @Post()
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