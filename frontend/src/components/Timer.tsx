import { useEffect, useState } from "react";

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
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {String(minutes).padStart(2, "0")}:
            {String(seconds).padStart(2, "0")}
        </span>
    );
}

export default Timer;