import { useEffect, useState } from "react";
import { Box } from "@mui/material";

interface TimerProps {
    time: number | null;
    running: boolean;
}


function Timer({ time, running }: TimerProps) {

    const [remainingMs, setRemainingMs] = useState<number | null>(time);



    useEffect(() => {
        setRemainingMs(time);

        if (time === null || !running) return;

        const startedAt = performance.now();

        const interval = window.setInterval(() => {
            const remaining = Math.max(
                0,
                time - (performance.now() - startedAt)
            );

            setRemainingMs(remaining);

            if (remaining === 0) {
                window.clearInterval(interval);
            }
        }, 100);

        return () => window.clearInterval(interval);
    }, [time, running]);

    if (remainingMs === null) return null;

    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;


    return (
        <Box
            sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",

                minWidth: 110,
                px: 2,
                py: 0.8,

                borderRadius: 2,

                bgcolor: running
                    ? "background.paper"
                    : "action.disabledBackground",

                fontSize: "1.6rem",
                fontWeight: 700,
                lineHeight: 1,

                fontFamily: "monospace",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "0.04em",

                boxShadow: running
                    ? "0 4px 14px rgba(0,0,0,0.14)"
                    : "none",

                border: "1px solid",
                borderColor: running
                    ? "divider"
                    : "transparent",

                transition: "all 180ms ease",

                userSelect: "none",
            }}
        >
            {String(minutes).padStart(2, "0")}
            <Box
                component="span"
                sx={{
                    mx: 0.25,
                    opacity: 0.65,
                }}
            >
                :
            </Box>
            {String(seconds).padStart(2, "0")}
        </Box>
    );
}

export default Timer;