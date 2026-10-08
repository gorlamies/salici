import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { HttpException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ExtendedError, Server, Socket } from "socket.io";
import { GamesService } from "./games.service";
import { ChessMoveInput } from "../chess/chess.types";
import { GameDto } from "./dto/game.dto";
import { PrismaService } from "../database/prisma.service";


type JoinPayload = { gameId: string };
type MovePayload = { gameId: string; move: ChessMoveInput };
type JwtPayload = { sub: string };

function gameRoom(gameId: string): string {
  return `game:${gameId}`;
}
function userRoom(username: string): string {
  return `user:${username}`;
}

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL ?? "http://localhost:5173" },
})
export class GamesGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly gamesService: GamesService,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) { }

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

  async handleConnection(client: Socket) {
    console.log(
      `[WS CONNECT] backend=${process.env.HOSTNAME} socket=${client.id}`,
    );
    await client.join(userRoom(client.data.user.sub));

    // for the first socket the user is set as online
    try {
      const sockets = await this.server.in(userRoom(client.data.user.sub)).fetchSockets();
      if (sockets.length === 1 && !(await this.isHidden(client.data.user.sub))) {
        await this.notifyFollowers(client.data.user.sub, true);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async handleDisconnect(client: Socket) {
    const username: string | undefined = client.data.user?.sub;
    if (!username) return;

    try {
      const sockets = await this.server.in(userRoom(username)).fetchSockets();
      if (sockets.length === 0 && !(await this.isHidden(username))) {
        await this.notifyFollowers(username, false);
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Returns which of the given users are connected (on any backend instance).
   * The users who hide their online status must be removed by the caller.
   */
  async findOnline(usernames: string[]): Promise<Set<string>> {
    if (usernames.length === 0) return new Set();
    const sockets = await this.server.in(usernames.map(userRoom)).fetchSockets();
    return new Set(sockets.map((socket) => socket.data.user.sub as string));
  }

  // called when a user changes hideOnlineStatus: the followers see the change immediately
  async notifyOnlineStatusVisibility(username: string, hidden: boolean) {
    if (hidden) {
      await this.notifyFollowers(username, false);
      return;
    }
    const online = await this.findOnline([username]);
    if (online.has(username)) {
      await this.notifyFollowers(username, true);
    }
  }

  // sends friend.online / friend.offline to everyone who follows the user
  private async notifyFollowers(username: string, online: boolean) {
    const follows = await this.prismaService.follow.findMany({
      where: { followedUsername: username },
      select: { followerUsername: true },
    });
    if (follows.length === 0) return;

    this.server
      .to(follows.map((follow) => userRoom(follow.followerUsername)))
      .emit(online ? "friend.online" : "friend.offline", { username });
  }

  private async isHidden(username: string): Promise<boolean> {
    const user = await this.prismaService.user.findUnique({
      where: { username },
      select: { hideOnlineStatus: true },
    });
    return user?.hideOnlineStatus ?? true;
  }

  notifyGameCreation(game: GameDto) {
    if (game.whitePlayerUsername)
      this.server.to(userRoom(game.whitePlayerUsername)).emit("game.created", game);
    if (game.blackPlayerUsername)
      this.server.to(userRoom(game.blackPlayerUsername)).emit("game.created", game);
  }

  notifyGameState(gameId: string, game: GameDto) {
    this.server
      .to(gameRoom(gameId))
      .emit("game.state", game);
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

      const sockets = await this.server.in(gameRoom(payload.gameId)).fetchSockets();
      const userIds = new Set(sockets.map((socket) => socket.data.user.sub));
      if (userIds.has(game.whitePlayerUsername) && userIds.has(game.blackPlayerUsername)) {
        const startedGame = await this.gamesService.startFirstMoveCountdown(game.id);
        if (startedGame !== null) {
          this.notifyGameState(game.id, startedGame);
        }
      }

    } catch (error) {
      if (error instanceof HttpException) {
        client.emit("game.error", {
          status_code: error.getStatus(),
          message: error.message,
        });
        return;
      }

      // fallback for errors
      console.error(error);
      client.emit("game.error", {
        status_code: 500,
        message: "Internal server error",
      });
    }
  }

  @SubscribeMessage("game.move")
  async handleMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MovePayload,
  ) {
    if (!payload?.gameId || !payload?.move) {
      client.emit("game.error", {
        status_code: 400,
        message: "gameId and move are required",
      });
      return;
    }

    try {
      const game = await this.gamesService.applyMove(
        payload.gameId,
        payload.move,
        client.data.user.sub,
      );
      this.server.to(gameRoom(payload.gameId)).emit("game.state", game);
    } catch (error) {
      // expected errors (403, 404, 409...)
      if (error instanceof HttpException) {
        client.emit("game.error", {
          status_code: error.getStatus(),
          message: error.message,
        });
        return;
      }

      // unexpected errors, see server logs
      console.error(error);
      client.emit("game.error", {
        status_code: 500,
        message: "Internal server error",
      });
    }
  }

  @SubscribeMessage("game.resign")
  async handleResign(
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
      const game = await this.gamesService.resign(
        payload.gameId,
        client.data.user.sub,
      );
      this.server.to(gameRoom(payload.gameId)).emit("game.state", game);
    } catch (error) {
      // expected errors (403, 404, 409...)
      if (error instanceof HttpException) {
        client.emit("game.error", {
          status_code: error.getStatus(),
          message: error.message,
        });
        return;
      }

      // unexpected errors, see server logs
      console.error(error);
      client.emit("game.error", {
        status_code: 500,
        message: "Internal server error",
      });
    }
  }
}
