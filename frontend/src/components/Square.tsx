import { ButtonBase, Box } from "@mui/material";
import type { SquareName } from "../types/chess";

interface SquareProps {
  name: SquareName;
  dark: boolean;
  selected: boolean;
  available: boolean;
  isCheck: boolean;
  onClick: (name: SquareName) => void;
  image?: string;
  orientation: string | null;
  onDragStart: (name: SquareName) => void;
  onDrop: (name: SquareName) => void;
  onDragEnd: () => void;
}

function Square({
  name,
  dark,
  selected,
  available,
  isCheck,
  onClick,
  image,
  orientation,
  onDragStart,
  onDrop,
  onDragEnd
}: SquareProps) {
  return (
    <ButtonBase
      onClick={() => onClick(name)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDrop(name)}
      sx={(theme) => ({
        width: "100%",
        aspectRatio: "1 / 1",
        backgroundColor: isCheck ? "#e74343" : selected ? dark ? "#dfff77" : "#e3ecae" : dark ? theme.palette.chess.dark : theme.palette.chess.light,
        borderRadius: 0,
        transform: orientation === "b" ? "rotate(180deg)" : "none", // if null acts as white
      })}

    >

      {image ? (
        <img
          src={image}
          alt=""
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            onDragStart(name);
          }}
          onDragEnd={onDragEnd}
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
