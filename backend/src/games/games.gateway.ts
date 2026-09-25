import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { HttpException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ExtendedError, Server, Socket } from "socket.io";
import { GamesService } from "./games.service";
import { ChessMoveInput } from "../chess/chess.types";

type JoinPayload = { gameId: string };
type MovePayload = { gameId: string; move: ChessMoveInput };
type JwtPayload = { sub: string };

function gameRoom(gameId: string): string {
  return `game:${gameId}`;
}

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL ?? "http://localhost:5173" },
})
export class GamesGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly gamesService: GamesService,
    private readonly jwtService: JwtService,
  ) {}

  // executed for every new connection
  afterInit(server: Server) {
    server.use(async (socket, next) => {
      const token: unknown = socket.handshake.auth?.token;
      const error: ExtendedError = new Error("Unauthorized access");
      error.data = {
        status_code: 401,
        message: "Unauthorized access",
      };

      if (typeof token !== "string" || token === "") {
        next(error);
        return;
      }

      try {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
          secret: process.env.JWT_ACCESS_SECRET!,
        });
        socket.data.user = payload;
        next();
      } catch {
        next(error);
      }
    });
  }

  @SubscribeMessage("game.join")
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinPayload,
  ) {
    if (!payload?.gameId) {
      client.emit("game.error", {
        status_code: 400,
        message: "gameId is required",
      });
      return;
    }

    try {
      const game = await this.gamesService.getGame(payload.gameId);
      await client.join(gameRoom(payload.gameId));
      client.emit("game.state", game);
    } catch (error) {
      if (error instanceof HttpException) {
        client.emit("game.error", {
          status_code: error.getStatus(),
          message: error.message,
        });
        return;
      }

      // no info for client, see server logs for details
      console.error(error);
      client.emit("game.error", {
        status_code: 500,
        message: "Internal server error",
      });
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
