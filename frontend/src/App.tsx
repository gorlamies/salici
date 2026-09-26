import { Routes, Route } from "react-router"

import HomePage from "./pages/HomePage"
import GamePage from "./pages/GamePage"
import AuthPage from "./pages/AuthPage"
import Header from "./components/Header"

function App() {

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </>
  )
}

export default App
