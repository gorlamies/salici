// theme.ts

import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
    palette: {
        mode: "light",

        primary: {
            light: "#A98274",
            main: "#795548",
            dark: "#5D4037",
            contrastText: "#FFFFFF",
        },

        secondary: {
            light: "#D7CCC8",
            main: "#A1887F",
            dark: "#6D4C41",
            contrastText: "#FFFFFF",
        },

        background: {
            default: "#F7F3F0",
            paper: "#FFFFFF",
        },

        text: {
            primary: "#2F2521",
            secondary: "#6F625C",
        },

        divider: "#D8CCC6",

        action: {
            hover: "rgba(121, 85, 72, 0.08)",
            selected: "rgba(121, 85, 72, 0.14)",
            disabled: "rgba(47, 37, 33, 0.35)",
            disabledBackground: "rgba(121, 85, 72, 0.10)",
        },

        success: {
            main: "#667A57",
        },

        warning: {
            main: "#B9823D",
        },

        error: {
            main: "#B55245",
        },

        info: {
            main: "#6A7B83",
        },
    },

    shape: {
        borderRadius: 10,
    },

    typography: {
        fontFamily: `"Inter", "Roboto", "Helvetica", "Arial", sans-serif`,
    },

    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    borderRadius: 8,
                },
            },
        },

        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                },
            },
        },
    },
});