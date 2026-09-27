import { AppBar, Toolbar, Box, Stack, Typography } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

export default function Header() {
    const { accessToken, username } = useAuth();
    const isLoggedIn = Boolean(accessToken);

    const navigate = useNavigate()

    return (
        <AppBar
            position="static"
            color="default"
            elevation={1}
        >
            <Toolbar sx={{ justifyContent: "space-between", gap: 2 }}>
                <Box
                    component="img"
                    src="/logo.svg"
                    alt="Salici"
                    sx={{ height: 40, width: "auto", display: "block" }}
                    onClick={() => navigate("/")}
                />

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
            </Toolbar>
        </AppBar>
    );
}