import { Box, Button, Fade, Stack, TextField, ToggleButton, ToggleButtonGroup, styled } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { MenuState } from "../types/menu";
import { createGame } from "../api/games"
import { useAuth } from "../context/AuthContext";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import { useBoardTransition } from "../context/BoardTransitionContext";


const TRANSITION_MS = 700;

const MenuButton = styled(Button)(({ theme }) => ({
  transition: "transform 200ms ease, box-shadow 200ms ease",

  "&:hover": {
    transform: "translateY(-4px) scale(1.02)",
    boxShadow: "0 12px 30px rgba(60, 35, 25, 0.25)",
  },

  "&:active": {
    transform: "translateY(-1px) scale(0.98)",
  },
}));

function HomePage() {

  const [menuState, setMenuState] = useState<MenuState>("main");
  const [opponent, setOpponent] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [gameMinutesMs, setGameMinutesMs] = useState<number | null>(null);
  const [gameIncrementMs, setGameIncrementMs] = useState<number | null>(null);


  const { accessToken, username } = useAuth();
  const navigate = useNavigate();
  const authFetch = useAuthenticatedFetch();
  const { setMode, setTransitioning, transitioning } = useBoardTransition();


  async function handleNewGameCreation() {
    try {

      if (transitioning) { return }
      const gameId = await createGame(
        {
          playerOneUsername: username!,
          playerTwoUsername: opponent,
          initialTimeMs: gameMinutesMs,
          incrementMs: gameIncrementMs,
        },
        authFetch
      );
      setTransitioning(true);
      window.setTimeout(() => {
        navigate(`/game/${gameId}`);
      }, TRANSITION_MS);

    } catch (error) {
      console.error("Could not create new game:", error);
    }
  }

  useEffect(() => {
    setMode("home");
    setTransitioning(false);
  }, [setMode, setTransitioning]);


  return (
    <>
      {/* LEFT MENU */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          width: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",


          opacity: transitioning ? 0 : 1,

          transform: transitioning
            ? "translateX(-80px)"
            : "translateX(0)",

          transition: `
          opacity ${TRANSITION_MS * 0.55}ms ease,
          transform ${TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)
        `,

          pointerEvents: transitioning
            ? "none"
            : "auto",
        }}
      >
        {/* MAIN MENU */}
        <Fade
          in={
            menuState === "main" &&
            !transitioning
          }
          timeout={500}
        >
          <Stack
            spacing={2}
            sx={{
              position: "absolute",
              width: "min(360px, 90%)",
            }}
          >
            <MenuButton
              onClick={() =>
                setMenuState("createGame")
              }
              variant="contained"
            >
              New Game
            </MenuButton>

            {username && accessToken && (
              <MenuButton
                onClick={() => navigate(`/profile/${username}`)}
                variant="contained"
              >
                My Profile
              </MenuButton>
            )}

            <MenuButton
              onClick={() =>
                navigate("/auth")
              }
              variant="contained"
            >
              Login
            </MenuButton>

          </Stack>
        </Fade>

        {/* CREATE GAME MENU */}
        <Fade
          in={
            menuState === "createGame" &&
            !transitioning
          }
          timeout={500}
        >
          <Stack
            spacing={2}
            sx={{
              position: "absolute",
              width: "min(420px, 95%)",
            }}
          >
            <TextField
              value={opponent}
              onChange={(event) =>
                setOpponent(event.target.value)
              }
              label="Opponent"
            />

            <ToggleButtonGroup
              value={time}
              exclusive
              onChange={(_, value: string | null) => {
                setTime(value ?? "");

                if (value === null) {
                  setGameMinutesMs(null);
                  setGameIncrementMs(null);
                  return;
                }

                const [
                  minutes,
                  incrementSeconds,
                ] = value
                  .split("+")
                  .map((value) =>
                    Number(value.trim())
                  );

                setGameMinutesMs(
                  minutes * 60 * 1000
                );

                setGameIncrementMs(
                  incrementSeconds * 1000
                );
              }}
              aria-label="Game duration"
              color="primary"
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, 1fr)",
                gap: 1,

                "& .MuiToggleButtonGroup-grouped":
                {
                  margin: 0,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: "4px",
                },
              }}
            >
              {[
                "1 + 0",
                "1 + 1",
                "2 + 1",
                "3 + 0",
                "3 + 2",
                "5 + 0",
                "10 + 0",
                "10 + 5",
                "15 + 0",
              ].map((duration) => (
                <ToggleButton
                  key={duration}
                  value={duration}
                >
                  {duration}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <MenuButton
              onClick={handleNewGameCreation}
              variant="contained"
            >
              Create Game
            </MenuButton>

            <MenuButton
              onClick={() =>
                setMenuState("main")
              }
              variant="contained"
            >
              Back
            </MenuButton>
          </Stack>
        </Fade>
      </Box>
    </>

  );
}
export default HomePage