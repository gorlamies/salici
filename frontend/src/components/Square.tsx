import { ButtonBase } from "@mui/material"
import type { SquareName } from "../types/chess";

interface SquareProps {
    name: SquareName
    dark: boolean
    selected: boolean
    onClick: (name: SquareName) => void;
    image?: string
    orientation: string;
}

function Square({ name, dark, selected, onClick, image, orientation }: SquareProps) {
    return (
        <ButtonBase
            onClick={() => onClick(name)}
            sx={{
                width: "100%",
                aspectRatio: "1 / 1",
                backgroundColor: selected ? dark ? "#dfff77" : "#e3ecae" : dark ? "#73bbfa" : "#cfeaff",
                borderRadius: 0,
                transform: orientation === "b" ? "rotate(180deg)" : "none",
            }}
        >
            {image ? <img
                src={image}
                alt=""
                draggable={false}
                style={{
                    width: "80%",
                    height: "80%",
                    objectFit: "contain",
                }} /> : null}
        </ButtonBase>
    )
}

export default Square