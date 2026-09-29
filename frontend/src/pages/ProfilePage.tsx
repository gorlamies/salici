import { Box, Button, Typography, Stack } from "@mui/material"
import { useNavigate, useParams, } from "react-router";
import { useEffect, useState } from "react";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import { getProfileInfo } from "../api/profile"
import { useAuth } from "../context/AuthContext";


export default function ProfilePage() {

    const navigate = useNavigate();
    const { UserId } = useParams();
    const { username } = useAuth();
    const authFetch = useAuthenticatedFetch();


    const [data, setData] = useState<{
        username: string;
        email: string;
    }>({
        username: "",
        email: "",
    });

    useEffect(() => {
        if (!UserId) return;

        async function loadProfile() {
            try {
                const response = await getProfileInfo(
                    {
                        username: UserId!,
                    },
                    authFetch
                );
                setData({
                    username: response.username,
                    email: response.email,
                });

            } catch (error) {

                console.error("Could not create new game:", error);
                navigate("/")
            }

        }
        loadProfile();
    }, [UserId, authFetch, navigate])


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
            <Stack spacing={2}>
                <Typography>
                    Username: {data.username}
                </Typography>

                <Typography>
                    Email: {data.email}
                </Typography>

                {username === UserId ? (<Button variant="contained" onClick={() => navigate("/")}> Logout</Button>) : (null)}
            </Stack>
        </Box>
    )
}