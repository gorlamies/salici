import { Box, ButtonBase } from "@mui/material";
import type { SquareName, FenPiece, Position } from "../types/chess";
import { parseFen } from "../pages/GamePage";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const ranks = [8, 7, 6, 5, 4, 3, 2, 1] as const;

const fen =
    "r1bk3r/p2pBpNp/n4n2/1p1NP2P/6P1/3P4/P1P1K3/q5b1 b - - 1 1";

const pieceImages: Record<FenPiece, string> = {
    p: "/pieces/PawnBlack.svg",
    P: "/pieces/PawnWhite.svg",
    b: "/pieces/BishopBlack.svg",
    B: "/pieces/BishopWhite.svg",
    n: "/pieces/KnightBlack.svg",
    N: "/pieces/KnightWhite.svg",
    q: "/pieces/QueenBlack.svg",
    Q: "/pieces/QueenWhite.svg",
    k: "/pieces/KingBlack.svg",
    K: "/pieces/KingWhite.svg",
    r: "/pieces/RookBlack.svg",
    R: "/pieces/RookWhite.svg",
};

type SquareProps = {
    name: SquareName;
    dark: boolean;
    piece?: FenPiece;
};

function Square({ name, dark, piece }: SquareProps) {
    return (
        <ButtonBase
            aria-label={name}
            disableRipple
            sx={(theme) => ({
                width: "100%",
                height: "100%",
                backgroundColor: dark
                    ? theme.palette.chess.dark
                    : theme.palette.chess.light,
                borderRadius: 0,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            })}
        >
            {piece && (
                <Box
                    component="img"
                    src={pieceImages[piece]}
                    alt=""
                    sx={{
                        width: "80%",
                        height: "80%",
                        objectFit: "contain",
                        pointerEvents: "none",
                    }}
                />
            )}
        </ButtonBase>
    );
}

export default function HomeBackground() {
    const position: Position = parseFen(fen);

    return (
        <Box
            sx={{
                width: "100%",
                aspectRatio: "1 / 1",

                display: "grid",
                gridTemplateColumns: "repeat(8, 1fr)",
                gridTemplateRows: "repeat(8, 1fr)",

                overflow: "hidden",
            }}
        >
            {ranks.flatMap((rank, rowIndex) =>
                files.map((file, columnIndex) => {
                    const name = `${file}${rank}` as SquareName;
                    const piece = position[name];

                    return (
                        <Square
                            key={name}
                            name={name}
                            dark={(rowIndex + columnIndex) % 2 === 1}
                            piece={piece}
                        />
                    );
                })
            )}
        </Box>
    );
}