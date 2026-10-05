import { Box } from "@mui/material";
import type { ReactNode } from "react";


type BoardStageProps = {
    children: ReactNode;
};

export default function BoardStage({ children }: BoardStageProps) {
    return (
        <Box
            sx={{
                width: "min(72dvh, 72vw)",
                aspectRatio: "1 / 1",
                flexShrink: 0,
            }}
        >
            {children}
        </Box>
    );
}