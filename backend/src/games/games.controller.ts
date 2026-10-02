import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { GamesService } from "./games.service";
import { GamesGateway } from "./games.gateway";
import { ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";
import { AuthenticatedRequest } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/auth.guard";
import { GameDto } from "./dto/game.dto";
import { CreateGameDto } from "./dto/createGame.dto";
import { CreateGameResponseDto } from "./dto/createGameResponse.dto";

@Controller("games")
@ApiBearerAuth()
export class GamesController {
  constructor(private readonly gamesService: GamesService, private readonly gamesGateway: GamesGateway) { }


  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: CreateGameResponseDto })
  async createGame(@Body() body: CreateGameDto): Promise<CreateGameResponseDto> {

    const createdGame = await this.gamesService.createGame(body);

    // the players are notified with the whole game infos
    const game = await this.gamesService.getGame(createdGame.gameId);
    this.gamesGateway.notifyGameCreation(game);

    return createdGame;
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: GameDto })
  async getGame(@Param("id") id: string): Promise<GameDto> {
    return await this.gamesService.getGame(id);
  }


  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: [GameDto] })
  async getOpenGames(
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.gamesService.getOpenGames(request.user.sub);
  }
}
