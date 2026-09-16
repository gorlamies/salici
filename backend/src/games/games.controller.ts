import { Controller, Get, Post, Param, ParseIntPipe } from "@nestjs/common";
import { GamesService } from "./games.service";
import { ChessMoveInput } from "../chess/chess.types";

@Controller("games")
export class GamesController {
  constructor(private readonly gamesService: GamesService) { }

  @Post()
  createGame() {
    return this.gamesService.createGame();
  }

  @Get(":id")
  getGames(@Param("id", ParseIntPipe) id: number) {
    return this.gamesService.getGame(id);
  }

  @Post(":id/moves")
  applyMove(
    @Param("id", ParseIntPipe) id: number,
    @Body() input: ChessMoveInput,
  ) {
    return this.gamesService.applyMove(id, input);
  }
}
}