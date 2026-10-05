import { AppBar, Toolbar, Box, Stack, Typography, ButtonBase } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

export default function Header() {
    const { accessToken, username } = useAuth();
    const isLoggedIn = Boolean(accessToken);

    const navigate = useNavigate()

    function handleUserIconClick() {
        if (isLoggedIn) {
            navigate("/profile/" + username)
        }
    }

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
            </Toolbar>
        </AppBar>
    );
}