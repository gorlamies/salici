import { MessageBody, SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { GamesService } from "./games.service";
import { ChessMoveInput } from "../chess/chess.types";

@WebSocketGateway({
    cors: {
        origin: "http://localhost:5173",
    },
})
export class GamesGateway {

    constructor(private readonly gameService: GamesService) { }


    @SubscribeMessage("makeMove")
    makeMove({ },
        @MessageBody()
        data: {
            gameId: number;
            move: ChessMoveInput;
        },
    ) {
        return this.gameService.applyMove(
            data.gameId,
            data.move,
        )
    }
}