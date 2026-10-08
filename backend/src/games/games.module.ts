import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { ChessModule } from '../chess/chess.module';
import { DatabaseModule } from '../database/database.module';
import { GamesGateway } from './games.gateway'
import { AuthModule } from '../auth/auth.module';
import { ClockModule } from '../clock/clock.module';
import { GameTimeoutService } from './games.timeout.service';
import { RatingModule } from '../rating/rating.module';

@Module({
  imports: [ChessModule, DatabaseModule, AuthModule, ClockModule, RatingModule],
  controllers: [GamesController],
  providers: [GamesService, GamesGateway, GameTimeoutService],
  exports: [GamesGateway],
})
export class GamesModule { }