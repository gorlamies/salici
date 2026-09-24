import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GamesService } from "./games.service";
import { ChessMoveInput } from "../chess/chess.types";
import { toErrorPayload } from "../common/filters/all-exceptions.filter";
import { WsJwtAuthGuard } from "../auth/auth.ws.guard";
import { UseGuards } from "@nestjs/common";

type JoinPayload = { gameId: string };
type MovePayload = { gameId: string; move: ChessMoveInput };

function gameRoom(gameId: string): string {
  return `game:${gameId}`;
}

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL ?? "http://localhost:5173" },
})
export class GamesGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly gamesService: GamesService) { }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage("game.join")
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinPayload,
  ) {
    if (!payload?.gameId) {
      client.emit("game.error", { message: "gameId is required" });
      return;
    }

    try {
      const game = await this.gamesService.getGame(payload.gameId);
      await client.join(gameRoom(payload.gameId));
      client.emit("game.state", game);
    } catch (error) {
      client.emit("game.error", toErrorPayload(error));
    }
  }

  /*

  @SubscribeMessage("game.move")
  async handleMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MovePayload,
  ) {
    if (!payload?.gameId || !payload?.move) {
      client.emit("game.error", { message: "gameId and move are required" });
      return;
    }

    try {
      const game = await this.gamesService.applyMove(payload.gameId, payload.move);
      this.server.to(gameRoom(payload.gameId)).emit("game.state", game);
    } catch (error) {
      client.emit("game.error", toErrorPayload(error));
    }
  }
    */
}