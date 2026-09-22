import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from "@mui/material";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import { useNavigate } from "react-router";

export interface DialogProps {
    open: boolean;
    result: string;
}

export default function DialogEndGame({ open, result }: DialogProps) {
    const navigate = useNavigate();

    function handleClose() {
        navigate("/");
    }

    return (
        <Dialog
            open={open}
            maxWidth="xs"
            fullWidth
            sx={{
                borderRadius: 3,
                p: 2,
                textAlign: "center",
            }}
        >
            <DialogTitle>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <EmojiEventsRoundedIcon
                        sx={{
                            fontSize: 52,
                        }}
                    />

                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Game Over
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Typography
                    variant="h6"
                    sx={{
                        mt: 1,
                        fontWeight: 500,
                    }}
                >
                    {result}
                </Typography>
            </DialogContent>

            <DialogActions
                sx={{
                    justifyContent: "center",
                    pb: 2,
                }}
            >
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleClose}
                    sx={{
                        px: 4,
                        borderRadius: 2,
                        textTransform: "none",
                    }}
                >
                    Back to Homepage
                </Button>
            </DialogActions>
        </Dialog>
    );
}