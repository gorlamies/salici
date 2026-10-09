import { Box, Button } from "@mui/material";
import BoardStage from "./BoardStage";
import HomeBackground from "./HomeBackground";
import Board from "./board";
import Timer from "./Timer";
import { useBoardTransition } from "../context/BoardTransitionContext";



export default function PersistentBoardLayer() {

    const {
        mode,
        transitioning,
        color,
        position,
        fen,
        onMove,
        topTime,
        bottomTime,
        topRunning,
        bottomRunning,
        onResign,
    } = useBoardTransition();

    return (
        <Box
            sx={{
                position: "fixed",
                top: "55%",
                left:
                    mode === "home" && !transitioning
                        ? "70%"
                        : "50%",

                transform: "translate(-50%, -50%)",

                opacity: mode === "hidden" ? 0 : 1,
                zIndex: mode === "hidden" ? -1 : 1,
                transition:
                    "left 700ms cubic-bezier(0.22, 1, 0.36, 1)",



            }}
        >
            <BoardStage>
                {/* BOARD SURFACE */}
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                    }}
                >
                    {mode === "home" && <HomeBackground />}

                    {mode === "game" && (
                        <Board
                            color={color}
                            position={position}
                            fen={fen}
                            onMove={onMove ?? undefined}
                        />
                    )}
                </Box>

                {/* GAME UI */}
                {mode === "game" && (
                    <>
                        {/* TOP TIMER */}
                        <Box
                            sx={{
                                position: "absolute",
                                left: 0,
                                bottom: "100%",
                                mb: 1,
                                zIndex: 2,
                            }}
                        >
                            <Timer
                                time={topTime}
                                running={topRunning}
                            />
                        </Box>

                        {/* BOTTOM TIMER */}
                        <Box
                            sx={{
                                position: "absolute",
                                left: 0,
                                top: "100%",
                                mt: 1,
                                zIndex: 2,
                            }}
                        >
                            <Timer
                                time={bottomTime}
                                running={bottomRunning}
                            />
                        </Box>

                        {/* RESIGN BUTTON */}
                        <Box
                            sx={{
                                position: "absolute",
                                left: "100%",
                                bottom: 0,
                                ml: 2,
                                zIndex: 2,
                            }}
                        >
                            <Button
                                variant="contained"
                                onClick={onResign ?? undefined}
                            >
                                Resign
                            </Button>
                        </Box>
                    </>
                )}
            </BoardStage>
        </Box>
    );
}