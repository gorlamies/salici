import { createContext, useContext, useState } from "react";
import type { Color, Position, SquareName, } from "../types/chess";


type BoardMode = "home" | "game" | "hidden";

type BoardTransitionContextType = {
    mode: BoardMode;
    setMode: (mode: BoardMode) => void;

    transitioning: boolean;
    setTransitioning: (value: boolean) => void;

    color: Color | null;
    setColor: (color: Color | null) => void;

    position: Position;
    setPosition: (position: Position) => void;

    fen: string;
    setFen: (fen: string) => void;

    onMove: ((from: SquareName, to: SquareName) => void) | null;
    setOnMove: (
        fn: ((from: SquareName, to: SquareName) => void) | null
    ) => void;

    topTime: number | null;
    setTopTime: (value: number | null) => void;

    bottomTime: number | null;
    setBottomTime: (value: number | null) => void;

    topRunning: boolean;
    setTopRunning: (value: boolean) => void;

    bottomRunning: boolean;
    setBottomRunning: (value: boolean) => void;

    onResign: (() => void) | null;
    setOnResign: (handler: (() => void) | null) => void;
};

const BoardTransitionContext =
    createContext<BoardTransitionContextType | null>(null);

export function BoardTransitionProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mode, setMode] = useState<BoardMode>("home");

    const [transitioning, setTransitioning] = useState(false);

    const [color, setColor] = useState<Color | null>(null);

    const [position, setPosition] = useState<Position>({});

    const [fen, setFen] = useState("");

    const [onMove, setOnMoveState] = useState<((from: SquareName, to: SquareName) => void) | null>(null);

    function setOnMove(fn: ((from: SquareName, to: SquareName) => void) | null) { setOnMoveState(() => fn); }

    const [topTime, setTopTime] = useState<number | null>(null);

    const [bottomTime, setBottomTime] = useState<number | null>(null);

    const [topRunning, setTopRunning] = useState(false);

    const [bottomRunning, setBottomRunning] = useState(false);

    const [onResign, setOnResign] = useState<(() => void) | null>(null);

    return (
        <BoardTransitionContext.Provider
            value={{
                mode,
                setMode,

                transitioning,
                setTransitioning,

                color,
                setColor,

                position,
                setPosition,

                fen,
                setFen,

                onMove,
                setOnMove,

                topTime,
                setTopTime,

                bottomTime,
                setBottomTime,

                topRunning,
                setTopRunning,

                bottomRunning,
                setBottomRunning,

                onResign,
                setOnResign,
            }}
        >
            {children}
        </BoardTransitionContext.Provider>
    );
}

export function useBoardTransition() {
    const context =
        useContext(BoardTransitionContext);

    if (!context) {
        throw new Error(
            "useBoardTransition must be used inside BoardTransitionProvider"
        );
    }

    return context;
}