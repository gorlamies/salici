import { Box, Button, Fade, Stack } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router";
import type { MenuState } from "../types/menu";
import { createGame } from "../api/games"
import { io } from "socket.io-client";


const socket = io("http://localhost:3000", {
  autoConnect: false,
});

function HomePage() {

  const [menuState, setMenuState] = useState<MenuState>("main")
  const [time, setTime] = useState("")
  const navigate = useNavigate();

  async function handleNewGameCration() {
    try {
      const data = await createGame()
      socket.on("connect", () => {
        console.log("CONNECTED:", socket.id);
      });

      socket.on("connect_error", (error) => {
        console.error("SOCKET ERROR:", error.message);
        console.error(error);
      });

      socket.connect();
    }
    catch (error) {
      console.error("Could not create new game:", error);
    }

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
        </Stack>
      </Fade>



      <Fade in={menuState === "createGame"} timeout={500}>
        <Stack spacing={2}
          sx={{
            position: "absolute",
          }}>
          <Stack direction="row" spacing={2}>
            <Button
              variant={time === "10 | 0" ? "contained" : "outlined"}
              onClick={() => setTime("10 | 0")}
            >
              10 | 0
            </Button>

            <Button
              variant={time === "5 | 0" ? "contained" : "outlined"}
              onClick={() => setTime("5 | 0")}
            >
              5 | 0
            </Button>

            <Button
              variant={time === "3 | 2" ? "contained" : "outlined"}
              onClick={() => setTime("3 | 2")}
            >
              3 | 2
            </Button>
          </Stack>
          <Button onClick={handleNewGameCration} variant="contained"> Create Game</Button>
        </Stack>
      </Fade>




    </Box >
  )
}
export default HomePage