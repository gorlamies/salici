import { Controller, Get, Post } from "@nestjs/common";
import { GameService } from "./game.service";

@Controller("game")
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  createGame() {
    return this.gameService.createGame();
  }

  @Get()
  getGames() {
    return this.gameService.getGames();
  }
}