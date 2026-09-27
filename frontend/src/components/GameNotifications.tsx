import { useState, type MouseEvent } from "react";
import { useNavigate } from "react-router";
import { Badge, IconButton, ListItemText, Menu, MenuItem } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import type { Game } from "../api/games";

interface GameNotificationsProps {
    games: Game[];
    username: string | null;
}

function GameNotifications({ games, username }: GameNotificationsProps) {
    const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
    const [seenGameIds, setSeenGameIds] = useState<Set<string>>(new Set());
    const navigate = useNavigate();

    const unseenCount = games.filter((game) => !seenGameIds.has(game.id)).length;

    function handleOpen(event: MouseEvent<HTMLElement>) {
        setAnchorElement(event.currentTarget);
    }

    function handleClose() {
        setSeenGameIds(new Set(games.map((game) => game.id)));
        setAnchorElement(null);
    }

    function handleSelectGame(gameId: string) {
        handleClose();
        navigate(`/game/${gameId}`);
    }

    return (
        <>
            <IconButton onClick={handleOpen} aria-label="open games">
                <Badge badgeContent={unseenCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorElement}
                open={anchorElement !== null}
                onClose={handleClose}
            >
                {games.length === 0 ? (
                    <MenuItem disabled>No open games</MenuItem>
                ) : (
                    games.map((game) => {
                        const isNew = !seenGameIds.has(game.id);

                        return (
                            <MenuItem
                                key={game.id}
                                selected={isNew}
                                onClick={() => handleSelectGame(game.id)}
                            >
                                <ListItemText
                                    primary={`vs ${game.whitePlayerUsername === username ? game.blackPlayerUsername : game.whitePlayerUsername}`}
                                    secondary={game.id}
                                    slotProps={{
                                        primary: { sx: { fontWeight: isNew ? "bold" : "normal" } },
                                    }}
                                />
                            </MenuItem>
                        );
                    })
                )}
            </Menu>
        </>
    );
}

export default GameNotifications;