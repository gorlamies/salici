import { Routes, Route, useLocation } from "react-router"
import { Box, Fade } from "@mui/material"
import { lightTheme } from "./theme"
import { ThemeProvider, CssBaseline } from "@mui/material";

import HomePage from "./pages/HomePage"
import GamePage from "./pages/GamePage"
import AuthPage from "./pages/AuthPage"
import ProfilePage from "./pages/ProfilePage"
import Header from "./components/Header"
import PersistentBoardLayer from "./components/PersistenBoardLayer";
import { useBoardTransition }
  from "./context/BoardTransitionContext";

function App() {
  const location = useLocation();

  const {
    mode,
    transitioning,
    color,
    position,
    fen,
    onMove,
  } = useBoardTransition();


  return (

    <ThemeProvider theme={lightTheme}>

      <CssBaseline />
      <Header />

      <PersistentBoardLayer
        mode={mode}
        transitioning={transitioning}
        color={color}
        position={position}
        fen={fen}
        onMove={onMove ?? undefined} />
      <Fade key={location.pathname}
        in={true}
        timeout={500}>
        <Box>

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game/:gameId" element={<GamePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/profile/:UserId" element={<ProfilePage />} />
          </Routes>
        </Box>
      </Fade>
    </ThemeProvider >

  )
}

export default App
