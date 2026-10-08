import { useEffect, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router";
import { Badge, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import CircleIcon from "@mui/icons-material/Circle";
import { useAuth } from "../context/AuthContext";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import { getFollowing, type FollowedUser } from "../api/profile";
import { socket } from "../socket";

type PresencePayload = { username: string };

// online first, then by name
function sortFriends(friends: FollowedUser[]): FollowedUser[] {
    return [...friends].sort(
        (a, b) => Number(b.online) - Number(a.online) || a.username.localeCompare(b.username)
    );
}

function FriendsMenu() {
    const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
    const [friends, setFriends] = useState<FollowedUser[]>([]);
    const { accessToken } = useAuth();
    const authFetch = useAuthenticatedFetch();
    const navigate = useNavigate();

    const onlineCount = friends.filter((friend) => friend.online).length;

    async function loadFriends() {
        try {
            setFriends(await getFollowing(authFetch));
        } catch {
            console.log("error while retrieving the followed users");
        }
    }

    useEffect(() => {
        if (!accessToken) {
            setFriends([]);
            return;
        }

        loadFriends();

        function setOnline(username: string, online: boolean) {
            setFriends((previous) =>
                sortFriends(previous.map((friend) =>
                    friend.username === username ? { ...friend, online } : friend
                ))
            );
        }
        function handleFriendOnline({ username }: PresencePayload) {
            setOnline(username, true);
        }
        function handleFriendOffline({ username }: PresencePayload) {
            setOnline(username, false);
        }

        // only listeners: the connection is opened and closed by the Header
        socket.on("connect", loadFriends);
        socket.on("friend.online", handleFriendOnline);
        socket.on("friend.offline", handleFriendOffline);

        return () => {
            socket.off("connect", loadFriends);
            socket.off("friend.online", handleFriendOnline);
            socket.off("friend.offline", handleFriendOffline);
        };
    }, [accessToken]);

    function handleOpen(event: MouseEvent<HTMLElement>) {
        setAnchorElement(event.currentTarget);
        // the list may have changed (follow / unfollow from a profile)
        loadFriends();
    }

    function handleClose() {
        setAnchorElement(null);
    }

    function handleSelectFriend(username: string) {
        handleClose();
        navigate(`/profile/${username}`);
    }

    if (!accessToken) return null;

    return (
        <>
            <IconButton onClick={handleOpen} aria-label="friends">
                <Badge badgeContent={onlineCount} color="success">
                    <PeopleIcon />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorElement}
                open={anchorElement !== null}
                onClose={handleClose}
            >
                {friends.length === 0 ? (
                    <MenuItem disabled>You do not follow anyone yet</MenuItem>
                ) : (
                    friends.map((friend) => (
                        <MenuItem key={friend.username} onClick={() => handleSelectFriend(friend.username)}>
                            <ListItemIcon>
                                <CircleIcon
                                    sx={{ fontSize: 12, color: friend.online ? "success.main" : "text.disabled" }}
                                />
                            </ListItemIcon>
                            <ListItemText primary={friend.username} />
                        </MenuItem>
                    ))
                )}
            </Menu>
        </>
    );
}

export default FriendsMenu;