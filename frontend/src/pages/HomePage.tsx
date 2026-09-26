import { Box, Button, Fade, Stack, TextField } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router";
import type { MenuState } from "../types/menu";
import { createGame } from "../api/games"
import { useAuth } from "../context/AuthContext";
import { refreshAccessToken } from "../api/auth"

function HomePage() {

  const [menuState, setMenuState] = useState<MenuState>("main")
  const [opponent, setOpponent] = useState<string>("")
  const navigate = useNavigate();
  const { accessToken, setAccessToken, username } = useAuth()

  async function handleNewGameCreation() {
    try {
      const gameId = await createGame(
        {
          playerOneUsername: username!, //test values
          playerTwoUsername: opponent,
        },
        accessToken!,
      );

      navigate(`/game/${gameId}`);
    } catch (error) {
      console.error("Could not create new game:", error);
    }
  }

  async function refresh() {
    const tk = await refreshAccessToken()
    setAccessToken(tk)
  }


  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        p: 3,
        boxSizing: "border-box",
      }}
    >

      <Fade in={menuState === "main"} timeout={500}>
        <Stack spacing={2}
          sx={{
            position: "absolute",

          }}>
          <Button onClick={() => setMenuState("createGame")} variant="contained"> new game</Button>
          <Button onClick={() => navigate("/auth")} variant="contained"> login</Button>
          <Button onClick={() => console.log(accessToken)} variant="contained"> test token</Button>
          <Button onClick={() => refresh()} variant="contained"> refresh token</Button>
        </Stack>
      </Fade>



      <Fade in={menuState === "createGame"} timeout={500}>
        <Stack spacing={2}
          sx={{
            position: "absolute",
          }}>

          <TextField
            value={opponent}
            onChange={(event) => setOpponent(event.target.value)}
          />
          <Button onClick={handleNewGameCreation} variant="contained"> Create Game</Button>
        </Stack>
      </Fade>




    </Box >
  )
}
export default HomePage