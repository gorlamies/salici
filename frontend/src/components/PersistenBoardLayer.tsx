import { Box } from "@mui/material";
import BoardStage from "./BoardStage";
import HomeBackground from "./HomeBackground";
import Board from "./board";

type Props = {
    mode: "home" | "game";
    transitioning?: boolean;
    color?: any;
    position?: any;
    fen?: string;
    onMove?: any;
};

export default function PersistentBoardLayer({
    mode,
    transitioning = false,
    color,
    position,
    fen = "",
    onMove,
}: Props) {
    return (
        <Box
            sx={{
                position: "fixed",
                top: "50%",
                left:
                    mode === "home" && !transitioning
                        ? "70%"
                        : "50%",

                transform: "translate(-50%, -50%)",

                transition:
                    "left 700ms cubic-bezier(0.22, 1, 0.36, 1)",

                zIndex: 1,
            }}
        >
            <BoardStage>
                {mode === "home" ? (
                    <HomeBackground />
                ) : (
                    <Board
                        color={color}
                        position={position}
                        fen={fen}
                        onMove={onMove}
                    />
                )}
            </BoardStage>
        </Box>
    );
}