
import { Box, Button, Stack, Typography, TextField } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router";
import { signup, login } from "../api/auth"
import type { LoginDto, SignupDto } from "../api/auth";
import { useAuth } from "../context/AuthContext";

type AuthMode = "login" | "signup"

function AuthPage() {
    const navigate = useNavigate()
    const { setAccessToken, setUsername } = useAuth();

    const [mode, setMode] = useState<AuthMode>("login");

    const [username, setUser] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleFormSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault()

        setError(null);
        setLoading(true);
        setUsername(username)

        try {
            if (mode === "login") {
                const dto: LoginDto = { username, password };
                const data = await login(dto);
                setAccessToken(data.accessToken)
                navigate("/")

            }
            else {
                const dto: SignupDto = { username, email, password }
                await signup(dto)
            }
            setMode("login");
        }
        catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Something went wrong");
            }
        }
        finally { setLoading(false) }



        return
    }
    return (


        <Box
            component="form"
            onSubmit={handleFormSubmit}
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
                    onChange={(event) => setUser(event.target.value)}
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