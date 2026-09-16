import { Injectable } from "@nestjs/common";
import {ChessService} from "../chess/chess.service"
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class GameService {
  constructor(
    private readonly chessService: ChessService,
    private readonly prismaService: PrismaService,
  ) {}

  async createGame() {
    const fen = this.chessService.createInitialPosition();
    return this.prismaService.game.create({
      data: { 
        initialFen: fen,
        currentFen: fen,
      },
    })
  }

  getGames() {
    const games = this.prismaService.game.findMany();
    return games;
  }
}
