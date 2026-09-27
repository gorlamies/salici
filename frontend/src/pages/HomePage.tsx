import { Box, Button, Fade, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { MenuState } from "../types/menu";
import { createGame, getOpenGames, type Game } from "../api/games"
import { useAuth } from "../context/AuthContext";
import { refreshAccessToken } from "../api/auth"
import { socket } from "../socket";
import GameNotifications from "../components/GameNotifications";

function HomePage() {

  const [menuState, setMenuState] = useState<MenuState>("main")
  const [opponent, setOpponent] = useState<string>("")
  const navigate = useNavigate();
  const { accessToken, setAccessToken, username } = useAuth()
  const [openGames, setOpenGames] = useState<Game[]>([]);

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

  useEffect(() => {
    async function handleConnect() {
      try {
        setOpenGames(await getOpenGames(accessToken));
      }
      catch {
        console.log("error while retrieving open games");
      }
    }

    function handleGameCreated(game: Game) {
      // add the game if it's not already in
      setOpenGames(prev =>
        prev.some(g => g.id === game.id)
          ? prev
          : [game, ...prev],
      );
    }

    async function handleConnectionError(error: Error) {
      const connectionError = error as Error & {
        data?: {
          status_code: number;
          message: string;
        };
      };
      if (connectionError.data?.status_code !== 401) {
        console.log(connectionError.message);
        return;
      }
      try {
        const tk = await refreshAccessToken();
        setAccessToken(tk);
      } catch {
        navigate("/auth");
        return;
      }
    }

    socket.auth = { token: accessToken };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectionError);
    socket.on("game.created", handleGameCreated);

    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectionError);
      socket.off("game.created", handleGameCreated);
      socket.disconnect();
    };
  }, [accessToken, navigate]);


  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        p: 3,
        boxSizing: "border-box",
        position: "relative", // reference for the notifications bell
      }}
    >

      <Box sx={{ position: "absolute", top: 8, right: 8 }}>
        <GameNotifications games={openGames} username={username} />
      </Box>

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