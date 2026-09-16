import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { ChessModule } from '../chess/chess.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [ChessModule, DatabaseModule],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}