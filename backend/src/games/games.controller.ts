import {
  Body,
  Controller,
  ForbiddenException,
  BadRequestException,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { GamesService } from "./games.service";
import { GamesGateway } from "./games.gateway";
import { ChessMoveInput } from "../chess/chess.types";
import { ApiBody, ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";
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

    const game = await this.gamesService.createGame(body);
    //this.gamesGateway.notifyGameCreation(game)

    return game;
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

  @ApiBody({
    schema: {
      type: "object",
      required: ["from", "to"],
      properties: {
        from: { type: "string", example: "e2" },
        to: { type: "string", example: "e4" },
        promotion: {
          type: "string",
          enum: ["q", "r", "b", "n"],
          nullable: true,
        },
      },
    },
  })
  @ApiOkResponse({ type: GameDto })
  @Post(":id/moves")
  @UseGuards(JwtAuthGuard)
  applyMove(
    @Param("id") id: string,
    @Body() input: ChessMoveInput,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.gamesService.applyMove(id, input, request.user.sub);
  }
}
