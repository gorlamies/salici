import { Box, Button, Fade, Stack, TextField } from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import type { MenuState } from "../types/menu";
import { createGame, getOpenGames, type Game } from "../api/games"
import { useAuth } from "../context/AuthContext";
import { socket } from "../socket";
import GameNotifications from "../components/GameNotifications";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";

function HomePage() {

  const [menuState, setMenuState] = useState<MenuState>("main");
  const [opponent, setOpponent] = useState<string>("");
  const [openGames, setOpenGames] = useState<Game[]>([]);
  const { accessToken, username, refresh } = useAuth();
  const navigate = useNavigate();
  const authFetch = useAuthenticatedFetch();
  const refreshAttempted = useRef(false);


  async function handleNewGameCreation() {
    try {
      const gameId = await createGame(
        {
          playerOneUsername: username!,
          playerTwoUsername: opponent,
        },
        authFetch
      );

      navigate(`/game/${gameId}`);
    } catch (error) {
      console.error("Could not create new game:", error);
    }
  }

  useEffect(() => {
    async function handleConnect() {
      try {
        setOpenGames(await getOpenGames(authFetch));
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

      if (refreshAttempted.current) {
        console.error("Authentication failed after refreshing.");
        navigate("/auth")
        return;
      }

      refreshAttempted.current = true;
      try {
        await refresh();
      } catch {
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
  }, [accessToken, navigate, refresh]);


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
          <Button onClick={() => setMenuState("main")} variant="contained">Back</Button>
        </Stack>
      </Fade>
    </Box >
  )
}
export default HomePage