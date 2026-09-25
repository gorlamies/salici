import {
  Body,
  Controller,
  ForbiddenException,
  BadRequestException,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from "@nestjs/common";
import { GamesService } from "./games.service";
import { ChessMoveInput } from "../chess/chess.types";
import { ApiBody, ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { GameDto } from "./dto/game.dto";
import { CreateGameDto } from "./dto/createGame.dto";

@Controller("games")
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createGame(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateGameDto,
  ) {
    if (
      request.user.sub !== body.playerOneUsername &&
      request.user.sub !== body.playerTwoUsername
    ) {
      throw new ForbiddenException("You can only create a game you play in"); // 403
    }

    if (body.playerOneUsername === body.playerTwoUsername) {
      throw new BadRequestException("The two players must be different"); // 400
    }

    return await this.gamesService.createGame(body);
  }

  /*
  
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
  
    */
}
