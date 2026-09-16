import { Box, Button, Fade, Stack, FormControl, FormControlLabel, Radio, RadioGroup } from "@mui/material";
import { useState } from "react";
//import { useNavigate } from "react-router";
import type { MenuState } from "../types/menu";

function HomePage() {

  const [menuState, setMenuState] = useState<MenuState>("main")
  const [time, setTime] = useState("")
  //const navigate = useNavigate();



  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        p: 3,
        boxSizing: "border-box",
      }}
    >

      <Fade in={menuState === "main"} timeout={500}>
        <Stack spacing={2}
          sx={{
            position: "absolute",

          }}>
          <Button onClick={() => setMenuState("createGame")} variant="contained"> new game</Button>
          <Button onClick={() => setMenuState("createGame")} variant="contained"> login</Button>
        </Stack>
      </Fade>



      <Fade in={menuState === "createGame"} timeout={500}>
        <Stack spacing={2}
          sx={{
            position: "absolute",
          }}>
          <Stack direction="row" spacing={2}>
            <Button
              variant={time === "10 | 0" ? "contained" : "outlined"}
              onClick={() => setTime("10 | 0")}
            >
              10 | 0
            </Button>

            <Button
              variant={time === "5 | 0" ? "contained" : "outlined"}
              onClick={() => setTime("5 | 0")}
            >
              5 | 0
            </Button>

            <Button
              variant={time === "3 | 2" ? "contained" : "outlined"}
              onClick={() => setTime("3 | 2")}
            >
              3 | 2
            </Button>
          </Stack>
          <Button onClick={() => setMenuState("main")} variant="contained"> Create Game</Button>
        </Stack>
      </Fade>




    </Box >
  )
}
export default HomePage


/*
       <Button
        variant="contained"
        onClick={() => navigate("/game")}> New Game 
      </Button>
 */