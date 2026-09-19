import {Routes, Route} from "react-router"

import HomePage from "./pages/HomePage"
import GamePage from "./pages/GamePage"

function App() {

  return (
    <Routes>
      <Route path="/" element={<HomePage/>}/>
      <Route path="/game/:id" element={<GamePage/>}/>
    </Routes>
  )
}

export default App
