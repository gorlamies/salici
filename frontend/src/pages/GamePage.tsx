import Board from "../components/board"
import { Box, Button } from "@mui/material";
import { useNavigate, useParams, useSearchParams } from "react-router";
import DialogEndGame from "../components/DialogEndGame"
import type { Color } from "../types/chess";

function GamePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>();
  const gameId = Number(id)
  const [searchParams] = useSearchParams();
  const color: Color = searchParams.get("color") === "w" ? "W" : "b";

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          p: 3,
          boxSizing: "border-box",
        }}
      >
        <Board color={color} gameId={gameId} />

      </Box>
      <Button
        variant="contained"
        onClick={() => navigate("/")}>
        homepage
      </Button>
      <DialogEndGame open={true} result="white Winner" />
    </>
  )
}

export default GamePage