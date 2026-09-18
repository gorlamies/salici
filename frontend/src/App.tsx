import { Routes, Route } from "react-router"

import HomePage from "./pages/HomePage"
import GamePage from "./pages/GamePage"
import AuthPage from "./pages/AuthPage"

function App() {

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="/auth" element={<AuthPage />} />
    </Routes>
  )
}

export default App
