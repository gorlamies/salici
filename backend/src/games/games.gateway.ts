import { MessageBody, SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { GamesService } from "./games.service";
import { ChessMoveInput } from "../chess/chess.types";

@WebSocketGateway()
export class GamesGateway {
    constructor(private readonly gameService: GamesService) { }


    @SubscribeMessage("makeMove")
    async makeMove(
        @MessageBody()
        data: {
            gameId: int;
            move: ChessMoveInput;
        },
    ) {
        return this.gameService.applyMove(
            data.gameId,
            data.move,
        )
    }