import { Box, Button } from "@mui/material"
import { useNavigate, useParams, } from "react-router";
import { useEffect } from "react";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import { getProfileInfo } from "../api/profile"


export default function ProfilePage() {

    const navigate = useNavigate();
    const { UserId } = useParams();
    const authFetch = useAuthenticatedFetch();

    useEffect(() => {
        if (!UserId) return;

        async function loadProfile() {
            try {
                const data = await getProfileInfo(
                    {
                        username: UserId!,
                    },
                    authFetch
                );
                console.log(data)

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
            <Button variant="contained" onClick={() => navigate("/")}> Logout</Button>

        </Box>
    )
}