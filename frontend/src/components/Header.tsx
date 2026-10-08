import { AppBar, Toolbar, Box, Stack, Typography, ButtonBase } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import { useRef, useState, useEffect } from "react";
import { getOpenGames } from "../api/games"
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import { socket } from "../socket";
import type { Game, Move } from "../api/games";
import GameNotifications from "./GameNotifications";
import FriendsMenu from "./FriendsMenu";

export default function Header() {
    const [openGames, setOpenGames] = useState<Game[]>([]);
    const { accessToken, username, refresh } = useAuth();
    const authFetch = useAuthenticatedFetch();
    const navigate = useNavigate()
    const refreshAttempted = useRef(false);
    const isLoggedIn = Boolean(accessToken);

    function handleUserIconClick() {
        if (isLoggedIn) {
            navigate("/profile/" + username)
        }
    }

    useEffect(() => {

        if (!accessToken) {
            socket.disconnect();
            setOpenGames([]);
            return;
        }

        async function handleConnect() {
            refreshAttempted.current = false;
            try {
                setOpenGames(await getOpenGames(authFetch));
            }
            catch {
                console.log("error while retrieving open games");
            }
        }

        function handleGameCreated(game: Game) {
            setOpenGames(prev =>
                prev.some(existingGame => existingGame.id === game.id)
                    ? prev
                    : [game, ...prev]
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
    }, [accessToken, refresh,]);



    return (
        <AppBar
            position="fixed"
            color="default"
            elevation={1}

            sx={{
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1,

                backgroundColor: "rgba(247, 243, 240, 0.25)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            }}
        >
            <Toolbar sx={{ justifyContent: "space-between", gap: 2 }}>
                <Box
                    component="img"
                    src="/logo.svg"
                    alt="Salici"
                    sx={{ height: 40, width: "auto", display: "block" }}
                    onClick={() => navigate("/")}
                />
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{
                        alignItems: "center",
                    }}
                >

                    <FriendsMenu />
                    <GameNotifications games={openGames} username={username} />
                    <ButtonBase onClick={handleUserIconClick}>
                        <Stack direction="row" spacing={1} >
                            <AccountCircleIcon
                                sx={{
                                    color: isLoggedIn ? "success.main" : "text.disabled",
                                    fontSize: 32,
                                }}
                            />

                            <Box sx={{ minWidth: 0 }}>
                                <Typography noWrap>
                                    {isLoggedIn ? username ?? "User" : "Guest"}
                                </Typography>

                                <Typography variant="caption" color="text.secondary">
                                    {isLoggedIn ? "Logged in" : "Not logged in"}
                                </Typography>
                            </Box>
                        </Stack>
                    </ButtonBase>
                </Stack>
            </Toolbar>
        </AppBar>
    );
}