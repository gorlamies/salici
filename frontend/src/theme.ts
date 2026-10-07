import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
    interface Palette {
        chess: {
            light: string;
            dark: string;
            lightHover: string;
            darkHover: string;
            selected: string;
            possibleMove: string;
            background: string;
            surface: string;
            accent: string;
        };
    }

    interface PaletteOptions {
        chess?: {
            light: string;
            dark: string;
            lightHover: string;
            darkHover: string;
            selected: string;
            possibleMove: string;
            background: string;
            surface: string;
            accent: string;
        };
    }
}

export const lightTheme = createTheme({
    palette: {
        mode: "light",

        primary: {
            main: "#5C4033",
            light: "#7A5A49",
            dark: "#3B2922",
            contrastText: "#FFF9F2",
        },

        secondary: {
            main: "#A67C52",
            light: "#C29A72",
            dark: "#7C5B3C",
            contrastText: "#1F1713",
        },

        background: {
            default: "#F3ECE3",
            paper: "#FFF9F2",
        },

        text: {
            primary: "#241A16",
            secondary: "#6E5A50",
        },

        divider: "#D8C8B8",

        success: {
            main: "#5E7A61",
        },

        warning: {
            main: "#B68445",
        },

        error: {
            main: "#9D4B3E",
        },

        chess: {
            light: "#D8C2A8",
            dark: "#6B4A3A",
            lightHover: "#E4D2BC",
            darkHover: "#7A5745",
            selected: "#B98B5F",
            possibleMove: "#8B715E",
            background: "#211814",
            surface: "#30231D",
            accent: "#C99B68",
        },
    },
});