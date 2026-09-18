
import { Box, Button, Stack, Typography, TextField } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router";

type AuthMode = "login" | "signup"

function AuthPage() {
    const navigate = useNavigate()

    const [mode, setMode] = useState<AuthMode>("login");

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    return (


        <Box
            component="form"
            onSubmit={() => { }}
            sx={{
                width: "100%",
                maxWidth: 400,
                mx: "auto",
            }}
        >
            <Stack spacing={2}>
                <Typography variant="h5">
                    {mode === "login" ? "Login" : "Sign up"}
                </Typography>

                <TextField
                    label="Username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                    fullWidth
                />

                {mode === "signup" && (
                    <TextField
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        fullWidth
                    />
                )}

                <TextField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    fullWidth
                />

                {error && (
                    <Typography color="error">
                        {error}
                    </Typography>
                )}

                <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                >
                    {loading
                        ? "Loading..."
                        : mode === "login"
                            ? "Login"
                            : "Sign up"}
                </Button>

                <Button
                    type="button"
                    variant="text"
                    onClick={() =>
                        setMode((current) =>
                            current === "login" ? "signup" : "login"
                        )
                    }
                >
                    {mode === "login"
                        ? "Create an account"
                        : "Already have an account? Login"}
                </Button>
            </Stack>
        </Box>

    )

}

export default AuthPage