import { ButtonBase, Box } from "@mui/material";
import type { SquareName } from "../types/chess";

interface SquareProps {
  name: SquareName;
  dark: boolean;
  selected: boolean;
  available: boolean
  onClick: (name: SquareName) => void;
  image?: string;
  orientation: string | null;
}

function Square({
  name,
  dark,
  selected,
  available,
  onClick,
  image,
  orientation,
}: SquareProps) {
  return (
    <ButtonBase
      onClick={() => onClick(name)}
      sx={{
        width: "100%",
        aspectRatio: "1 / 1",
        backgroundColor: selected
          ? dark
            ? "#dfff77"
            : "#e3ecae"
          : dark
            ? "#73bbfa"
            : "#cfeaff",
        borderRadius: 0,
        transform: orientation === "b" ? "rotate(180deg)" : "none", // if null acts as white
      }}

    >

      {image ? (
        <img
          src={image}
          alt=""
          draggable={false}
          style={{
            width: "80%",
            height: "80%",
            objectFit: "contain",
          }}
        />
      ) : null}

      {available && (
        <Box
          sx={{
            position: "absolute",
            width: "22%",
            height: "22%",
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.25)",
            pointerEvents: "none",
          }}
        />
      )}
    </ButtonBase>
  );
}

export default Square;
