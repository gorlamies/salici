import {
    Alert,
    Box,
    Button,
    ButtonBase,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Paper,
    Stack,
    Switch,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import {
    changeEmail,
    changePassword,
    closeAccount,
    getProfile,
    getProfileGames,
    updateSettings,
    type GameSummary,
    type Profile,
} from "../api/profile";
import type { TimeCategory } from "../api/games";
import type { FenPiece, SquareName } from "../types/chess";
import { useAuth } from "../context/AuthContext";
import { logout } from "../api/auth";
import { useBoardTransition } from "../context/BoardTransitionContext";
import { parseFen } from "./GamePage";

type AuthFetch = ReturnType<typeof useAuthenticatedFetch>;

const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const ranks = [8, 7, 6, 5, 4, 3, 2, 1] as const;

const pieceImages: Record<FenPiece, string> = {
    p: "/pieces/PawnBlack.svg",
    P: "/pieces/PawnWhite.svg",
    b: "/pieces/BishopBlack.svg",
    B: "/pieces/BishopWhite.svg",
    n: "/pieces/KnightBlack.svg",
    N: "/pieces/KnightWhite.svg",
    q: "/pieces/QueenBlack.svg",
    Q: "/pieces/QueenWhite.svg",
    k: "/pieces/KingBlack.svg",
    K: "/pieces/KingWhite.svg",
    r: "/pieces/RookBlack.svg",
    R: "/pieces/RookWhite.svg",
};

const categoryNames: Record<TimeCategory, string> = {
    bullet: "Bullet",
    blitz: "Blitz",
    rapid: "Rapid",
    classical: "Classical",
    unlimited: "Unlimited",
};

// small read-only board with the final position of a game
function MiniBoard({ fen, flipped }: { fen: string; flipped: boolean }) {
    const position = parseFen(fen);
    // flipped by reading ranks and files backwards, so the pieces stay upright
    const shownRanks = flipped ? [...ranks].reverse() : ranks;
    const shownFiles = flipped ? [...files].reverse() : files;

    return (
        <Box
            sx={{
                width: 110,
                height: 110,
                flexShrink: 0,
                display: "grid",
                // minmax(0, 1fr): the squares never grow beyond 1/8 of the board,
                // even if the piece images are bigger (they are 72x72)
                gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
                gridTemplateRows: "repeat(8, minmax(0, 1fr))",
                borderRadius: 1,
                overflow: "hidden",
            }}
        >
            {shownRanks.flatMap((rank) =>
                shownFiles.map((file) => {
                    const name: SquareName = `${file}${rank}`;
                    const piece = position[name];
                    // a1 (file 0, rank 1) is dark
                    const dark = (files.indexOf(file) + rank) % 2 === 1;
                    return (
                        <Box
                            key={name}
                            sx={(theme) => ({
                                backgroundColor: dark ? theme.palette.chess.dark : theme.palette.chess.light,
                            })}
                        >
                            {piece && (
                                <Box
                                    component="img"
                                    src={pieceImages[piece]}
                                    alt=""
                                    sx={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
                                />
                            )}
                        </Box>
                    );
                })
            )}
        </Box>
    );
}

// result of the game seen by the owner of the profile
function describeResult(game: GameSummary, ownerIsWhite: boolean): { text: string; color: string } {
    if (game.state === "ready" || game.state === "running") return { text: "Ongoing", color: "warning.main" };
    if (game.state === "aborted") return { text: "Aborted", color: "text.disabled" };

    const whiteWon = ["white_win", "black_resigned", "black_timeout"].includes(game.state);
    const blackWon = ["black_win", "white_resigned", "white_timeout"].includes(game.state);
    if (!whiteWon && !blackWon) return { text: "Draw", color: "text.secondary" };

    return whiteWon === ownerIsWhite
        ? { text: "Win", color: "success.main" }
        : { text: "Loss", color: "error.main" };
}

// settings of your own account: password, email, online status, close account
function AccountSettings({
    profile,
    authFetch,
    onProfileChange,
    onAccountClosed,
}: {
    profile: Profile;
    authFetch: AuthFetch;
    onProfileChange: (profile: Profile) => void;
    onAccountClosed: () => void;
}) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState<{ ok: boolean; text: string } | null>(null);

    const [emailPassword, setEmailPassword] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [emailMessage, setEmailMessage] = useState<{ ok: boolean; text: string } | null>(null);

    const [closeOpen, setCloseOpen] = useState(false);
    const [closePassword, setClosePassword] = useState("");
    const [closeError, setCloseError] = useState<string | null>(null);

    async function handlePasswordChange(event: SyntheticEvent) {
        event.preventDefault();
        try {
            await changePassword(currentPassword, newPassword, authFetch);
            setPasswordMessage({ ok: true, text: "Password changed." });
            setCurrentPassword("");
            setNewPassword("");
        } catch (error) {
            setPasswordMessage({ ok: false, text: (error as Error).message });
        }
    }

    async function handleEmailChange(event: SyntheticEvent) {
        event.preventDefault();
        try {
            const email = await changeEmail(emailPassword, newEmail, authFetch);
            onProfileChange({ ...profile, email });
            setEmailMessage({ ok: true, text: "Email changed." });
            setEmailPassword("");
            setNewEmail("");
        } catch (error) {
            setEmailMessage({ ok: false, text: (error as Error).message });
        }
    }

    async function handleHideOnlineChange(hide: boolean) {
        try {
            const hideOnlineStatus = await updateSettings(hide, authFetch);
            onProfileChange({ ...profile, hideOnlineStatus });
        } catch {
            // the switch stays as it was
        }
    }

    async function handleClose(event: SyntheticEvent) {
        event.preventDefault();
        try {
            await closeAccount(closePassword, authFetch);
            onAccountClosed();
        } catch (error) {
            setCloseError((error as Error).message);
        }
    }

    return (
        <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={3}>
                <Typography variant="h5">Settings</Typography>

                {/* a real form, as in AuthPage: the browser checks the required fields */}
                <Stack component="form" onSubmit={handlePasswordChange} spacing={1.5}>
                    <Typography variant="subtitle1">Change password</Typography>
                    <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", rowGap: 1.5 }}>
                        <TextField size="small" type="password" label="Current password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
                        <TextField size="small" type="password" label="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
                        <Button type="submit" variant="contained">Change</Button>
                    </Stack>
                    {passwordMessage && (
                        <Alert severity={passwordMessage.ok ? "success" : "error"}>{passwordMessage.text}</Alert>
                    )}
                </Stack>

                {/* type="email": the browser checks the format, as in the signup form */}
                <Stack component="form" onSubmit={handleEmailChange} spacing={1.5}>
                    <Typography variant="subtitle1">Change email</Typography>
                    <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", rowGap: 1.5 }}>
                        <TextField size="small" type="email" label="New email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} required />
                        <TextField size="small" type="password" label="Current password" value={emailPassword} onChange={(event) => setEmailPassword(event.target.value)} required />
                        <Button type="submit" variant="contained">Change</Button>
                    </Stack>
                    {emailMessage && (
                        <Alert severity={emailMessage.ok ? "success" : "error"}>{emailMessage.text}</Alert>
                    )}
                </Stack>

                <FormControlLabel
                    control={
                        <Switch
                            checked={profile.hideOnlineStatus ?? false}
                            onChange={(event) => handleHideOnlineChange(event.target.checked)}
                        />
                    }
                    label="Hide my online status"
                />

                <Box>
                    <Button variant="outlined" color="error" onClick={() => setCloseOpen(true)}>
                        Close account
                    </Button>
                </Box>
            </Stack>

            <Dialog
                open={closeOpen}
                onClose={() => setCloseOpen(false)}
                slotProps={{ paper: { component: "form", onSubmit: handleClose } }}
            >
                <DialogTitle>Close your account?</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Typography>
                            You will not be able to log in again. Your games stay visible.
                        </Typography>
                        <TextField size="small" type="password" label="Current password" value={closePassword} onChange={(event) => setClosePassword(event.target.value)} required />
                        {closeError && <Alert severity="error">{closeError}</Alert>}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCloseOpen(false)}>Cancel</Button>
                    <Button type="submit" color="error" variant="contained">Close account</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

export default function ProfilePage() {

    const navigate = useNavigate();
    // the route is /profile/:UserId, the value is a username
    const { UserId: profileUsername } = useParams();
    const { username, setAccessToken, setUsername } = useAuth();
    const authFetch = useAuthenticatedFetch();
    const { setMode } = useBoardTransition();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileError, setProfileError] = useState(false);

    const [category, setCategory] = useState<TimeCategory | "all">("all");
    const [games, setGames] = useState<GameSummary[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    // authFetch changes when the token is refreshed: a ref avoids reloading the list every time
    const authFetchRef = useRef(authFetch);
    useEffect(() => {
        authFetchRef.current = authFetch;
    }, [authFetch]);

    const loadingRef = useRef(false);
    // answers for an old list are ignored
    const listIdRef = useRef(0);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    const isOwnProfile = username !== null && username === profileUsername;

    useEffect(() => {
        setMode("hidden");
    }, [setMode]);

    useEffect(() => {
        if (!profileUsername) return;
        let ignore = false;
        setProfile(null);
        setProfileError(false);
        getProfile(profileUsername, authFetchRef.current)
            .then((loadedProfile) => { if (!ignore) setProfile(loadedProfile); })
            .catch(() => { if (!ignore) setProfileError(true); });
        return () => { ignore = true; };
    }, [profileUsername]);

    async function loadGames(cursor: string | null, listId: number) {
        if (!profileUsername || loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        try {
            const page = await getProfileGames(
                profileUsername,
                cursor,
                category === "all" ? null : category,
                authFetchRef.current
            );
            if (listId !== listIdRef.current) return;
            setGames((previous) => [...previous, ...page.games]);
            setNextCursor(page.nextCursor);
            setHasMore(page.nextCursor !== null);
        } catch {
            // stop trying: the user can change filter or reload the page
            if (listId === listIdRef.current) setHasMore(false);
        } finally {
            if (listId === listIdRef.current) {
                loadingRef.current = false;
                setLoading(false);
            }
        }
    }

    // new profile or new category: start again from the first page
    useEffect(() => {
        listIdRef.current += 1;
        loadingRef.current = false;
        setGames([]);
        setNextCursor(null);
        setHasMore(true);
        loadGames(null, listIdRef.current);
    }, [profileUsername, category]);

    // when the bottom of the list becomes visible, load the next page
    useEffect(() => {
        const bottom = bottomRef.current;
        if (!bottom || !hasMore) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting && nextCursor !== null) {
                loadGames(nextCursor, listIdRef.current);
            }
        });
        observer.observe(bottom);
        return () => observer.disconnect();
        // profile: the bottom element exists only after the profile is loaded
    }, [profile, nextCursor, hasMore, games.length]);

    async function handleLogout() {
        await logout();
        setAccessToken(null);
        setUsername(null);
        navigate("/");
    }

    // the backend already removed the refresh token cookie
    function handleAccountClosed() {
        setAccessToken(null);
        setUsername(null);
        navigate("/");
    }

    if (profileError) {
        return (
            <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
                <Alert severity="error">This profile does not exist or cannot be loaded.</Alert>
            </Box>
        );
    }

    if (!profile) {
        return (
            <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        // the content area of the app does not scroll: the page has its own scroll.
        // zIndex 2: the shared board layer (zIndex 1) is only transparent in "hidden" mode,
        // it still covers the center of the screen and would take the clicks
        <Box sx={{ position: "absolute", inset: 0, overflowY: "auto", zIndex: 2 }}>
            <Stack spacing={3} sx={{ maxWidth: 820, mx: "auto", p: 3 }}>

                <Paper variant="outlined" sx={{ p: 3 }}>
                    <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                        <Box>
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                <Typography variant="h4">{profile.username}</Typography>
                                {profile.closedAt !== null && <Chip label="Account closed" size="small" />}
                            </Stack>
                            <Typography color="text.secondary">
                                Member since {new Date(profile.createdAt).toLocaleDateString()}
                            </Typography>
                            {profile.email !== undefined && (
                                <Typography color="text.secondary">{profile.email}</Typography>
                            )}
                        </Box>

                        <Stack direction="row" spacing={1}>
                            {profile.ongoingGameId !== null && (
                                <Button variant="contained" onClick={() => navigate(`/game/${profile.ongoingGameId}`)}>
                                    {isOwnProfile ? "Back to your game" : "Watch"}
                                </Button>
                            )}
                            {isOwnProfile && (
                                <Button variant="outlined" onClick={handleLogout}>Logout</Button>
                            )}
                        </Stack>
                    </Stack>

                    <Stack direction="row" sx={{ mt: 3, flexWrap: "wrap", gap: 1.5 }}>
                        {profile.ratings.map((rating) => (
                            <Paper key={rating.timeCategory} variant="outlined" sx={{ px: 2, py: 1, minWidth: 110, textAlign: "center" }}>
                                <Typography variant="caption" color="text.secondary">
                                    {categoryNames[rating.timeCategory]}
                                </Typography>
                                <Typography variant="h6">
                                    {rating.rating}{rating.provisional ? "?" : ""}
                                </Typography>
                            </Paper>
                        ))}
                    </Stack>
                </Paper>

                {isOwnProfile && (
                    <AccountSettings
                        profile={profile}
                        authFetch={authFetch}
                        onProfileChange={setProfile}
                        onAccountClosed={handleAccountClosed}
                    />
                )}

                <Stack spacing={1.5}>
                    <Typography variant="h5">Games</Typography>

                    <ToggleButtonGroup
                        value={category}
                        exclusive
                        size="small"
                        // a click on the selected button gives null: keep the current filter
                        onChange={(_, value: TimeCategory | "all" | null) => { if (value !== null) setCategory(value); }}
                        sx={{ flexWrap: "wrap" }}
                    >
                        <ToggleButton value="all">All</ToggleButton>
                        {profile.ratings.map((rating) => (
                            <ToggleButton key={rating.timeCategory} value={rating.timeCategory}>
                                {categoryNames[rating.timeCategory]}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>

                    {games.map((game) => {
                        const ownerIsWhite = game.whitePlayerUsername === profile.username;
                        const result = describeResult(game, ownerIsWhite);
                        const before = ownerIsWhite ? game.whiteRatingBefore : game.blackRatingBefore;
                        const after = ownerIsWhite ? game.whiteRatingAfter : game.blackRatingAfter;
                        const change = before !== null && after !== null ? after - before : null;

                        return (
                            <ButtonBase
                                key={game.id}
                                onClick={() => navigate(`/game/${game.id}`)}
                                sx={{
                                    justifyContent: "flex-start",
                                    textAlign: "left",
                                    gap: 2,
                                    p: 1.5,
                                    borderRadius: 2,
                                    border: 1,
                                    borderColor: "divider",
                                    bgcolor: "background.paper",
                                    "&:hover": { bgcolor: "action.hover" },
                                }}
                            >
                                <MiniBoard fen={game.currentFen} flipped={!ownerIsWhite} />
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: "bold" }}>
                                        {categoryNames[game.timeCategory]} · {game.timeLabel}
                                    </Typography>
                                    <Typography variant="body2" noWrap>
                                        {game.whitePlayerUsername} vs {game.blackPlayerUsername}
                                    </Typography>
                                    <Typography variant="body2">
                                        <Box component="span" sx={{ color: result.color, fontWeight: "bold" }}>{result.text}</Box>
                                        {change !== null && ` · ${change > 0 ? "+" : ""}${change}`}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(game.createdAt).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            </ButtonBase>
                        );
                    })}

                    {!loading && !hasMore && games.length === 0 && (
                        <Typography color="text.secondary">No games yet.</Typography>
                    )}

                    {loading && (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                            <CircularProgress size={28} />
                        </Box>
                    )}

                    {/* when this becomes visible the next page is loaded */}
                    <Box ref={bottomRef} sx={{ height: "1px" }} />
                </Stack>
            </Stack>
        </Box>
    );
}