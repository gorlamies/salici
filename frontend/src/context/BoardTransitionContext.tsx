// context/BoardTransitionContext.tsx

import {
    createContext,
    useContext,
    useState,
} from "react";

import type {
    Color,
    Position,
    SquareName,
} from "../types/chess";


type BoardMode = "home" | "game";

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
};

const BoardTransitionContext =
    createContext<BoardTransitionContextType | null>(null);

export function BoardTransitionProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mode, setMode] =
        useState<BoardMode>("home");

    const [transitioning, setTransitioning] =
        useState(false);

    const [color, setColor] =
        useState<Color | null>(null);

    const [position, setPosition] =
        useState<Position>({});

    const [fen, setFen] =
        useState("");

    const [onMove, setOnMoveState] =
        useState<
            ((from: SquareName, to: SquareName) => void) | null
        >(null);

    function setOnMove(
        fn: ((from: SquareName, to: SquareName) => void) | null
    ) {
        setOnMoveState(() => fn);
    }

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