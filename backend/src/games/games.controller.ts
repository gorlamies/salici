import { Body, Controller, Get, Post, Param, ParseIntPipe, UseGuards } from "@nestjs/common";
import { GamesService } from "./games.service";
import { ChessMoveInput } from "../chess/chess.types";
import { ApiBody, ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.guard";
import { GameDto } from "./dto/game.dto";


@Controller("games")
export class GamesController {
  constructor(private readonly gamesService: GamesService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: GameDto })
  createGame() {
    return this.gamesService.createGame();
  }

  @Get(":id")
  @ApiOkResponse({ type: GameDto })
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
  @ApiOkResponse({ type: GameDto })
  @Post(":id/moves")
  applyMove(
    @Param("id", ParseIntPipe) id: number,
    @Body() input: ChessMoveInput,
  ) {
    return this.gamesService.applyMove(id, input);
  }
}