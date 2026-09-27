import { Routes, Route, useLocation } from "react-router"
import { Box, Fade } from "@mui/material"

import HomePage from "./pages/HomePage"
import GamePage from "./pages/GamePage"
import AuthPage from "./pages/AuthPage"
import Header from "./components/Header"

function App() {
  const location = useLocation();


  return (
    <>
      <Header />
      <Fade key={location.pathname}
        in={true}
        timeout={500}>
        <Box>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game/:gameId" element={<GamePage />} />
            <Route path="/auth" element={<AuthPage />} />
          </Routes>
        </Box>
      </Fade>
    </>
  )
}

export default App
