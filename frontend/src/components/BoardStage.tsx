import { Box } from "@mui/material";
import type { ReactNode } from "react";

export const BOARD_SIZE = "min(72dvh, 72vw)";
export const BOARD_HALF = "calc(min(72dvh, 72vw) / 2)";

type BoardStageProps = {
    children: ReactNode;
};

export default function BoardStage({ children }: BoardStageProps) {
    return (
        <Box
            sx={{
                position: "relative",

                width: BOARD_SIZE,
                height: BOARD_SIZE,

                flexShrink: 0,

                overflow: "visible",
            }}
        >
            {children}
        </Box>
    );
}