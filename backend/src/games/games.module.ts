import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { ChessModule } from '../chess/chess.module';
import { DatabaseModule } from '../database/database.module';
import { GamesGateway } from './games.gateway'
import { AuthModule } from '../auth/auth.module';
import { ClockModule } from '../clock/clock.module';

@Module({
  imports: [ChessModule, DatabaseModule, AuthModule, ClockModule],
  controllers: [GamesController],
  providers: [GamesService, GamesGateway],
})
export class GamesModule { }