import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { ChessModule } from '../chess/chess.module';
import { DatabaseModule } from '../database/database.module';
import { GameGateway } from './games.gateway'

@Module({
  imports: [ChessModule, DatabaseModule],
  controllers: [GamesController],
  providers: [GamesService, GamesGateway],
})
export class GamesModule { }