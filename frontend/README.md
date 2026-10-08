# Salici frontend

React 19 + TypeScript + Vite application, with MUI for the components.
It runs in the `frontend` container (see the main [README](../README.md));
the server is authoritative, so the frontend never decides whether a move is legal or how a game ends.

## Scripts

| Script            | What it does                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `npm run dev`     | Vite dev server on port 5173 (the container runs it with `--host 0.0.0.0`)                              |
| `npm run build`   | `tsc -b` (type-check, `noUnusedLocals` and `noUnusedParameters` are on) and production build in `dist/` |
| `npm run lint`    | oxlint                                                                                                  |
| `npm run preview` | serves the production build                                                                             |

`vite dev` does not type-check: run `npm run build` before committing.

## Configuration

| Variable           | Example                 | Use                                                                           |
| ------------------ | ----------------------- | ----------------------------------------------------------------------------- |
| `VITE_BACKEND_URL` | `http://localhost:3000` | Base URL of the REST API and of the WebSocket (nginx in front of the backend) |

`VITE_` variables are embedded in the bundle at build time: never put secrets in them.

## Routes

Defined in `src/App.tsx`:

| Path               | Page          | Notes                                                                                  |
| ------------------ | ------------- | -------------------------------------------------------------------------------------- |
| `/`                | `HomePage`    | Main menu and creation of a game (opponent username and time control)                  |
| `/game/:gameId`    | `GamePage`    | A game, for players and spectators                                                     |
| `/auth`            | `AuthPage`    | Login and signup                                                                       |
| `/profile/:UserId` | `ProfilePage` | Profile of a user (`UserId` is the username): ratings, games, follow, account settings |

There are no protected routes: a guest can open every page, but the protected requests fail.

## Structure

```text
src/
├── main.tsx              # providers: AuthProvider > BoardTransitionProvider > BrowserRouter > App
├── App.tsx               # theme, Header, persistent board layer, routes
├── socket.ts             # the single socket.io connection (autoConnect false, websocket transport only)
├── sound.ts              # move, capture and check sounds (public/sounds)
├── theme.ts              # MUI theme, with the chess palette
├── api/
│   ├── client.ts         # authenticatedFetch: bearer token, one refresh and one retry on 401
│   ├── auth.ts           # signup, login, refresh, /auth/me, logout
│   ├── games.ts          # Game and Move types, create game, get game, open games
│   └── profile.ts        # profile, game history, follows, account settings
├── hooks/
│   └── useAuthenticatedFetch.ts   # authenticatedFetch bound to the current token (memoized)
├── context/
│   ├── AuthContext.tsx            # session, refresh, socket lifecycle
│   └── BoardTransitionContext.tsx # state shared with the persistent board
├── components/
│   ├── PersistenBoardLayer.tsx    # the board that stays mounted between pages
│   ├── BoardStage.tsx             # size of the board
│   ├── board.tsx, Square.tsx      # interactive board: selection, legal moves, drag and drop, check
│   ├── HomeBackground.tsx         # static board of the home page
│   ├── Timer.tsx                  # clock display with a local 100 ms tick
│   ├── MoveHistory.tsx            # move list in pairs
│   ├── DialogEndGame.tsx          # end of game dialog
│   ├── Header.tsx                 # logo, friends, open games, user
│   ├── GameNotifications.tsx      # bell with the open games of the user
│   └── FriendsMenu.tsx            # followed users and their online status
├── pages/                         # the four pages of the routes
└── types/                         # chess types (SquareName, Position, Color) and menu types
```

## Session and authentication

`AuthContext` owns the session (details in [docs/authentication.md](../docs/authentication.md)):

- on mount it calls `POST /auth/refresh` (refresh cookie) and `GET /auth/me`;
  until this finishes the application shows "Loading session…";
- the access token lives only in React state;
- `refresh()` is single-flight: concurrent callers share the same request;
- `useAuthenticatedFetch()` returns a fetch that sends `Authorization: Bearer <token>`
  and, on a 401, refreshes once and retries once;
- logout (`ProfilePage`) calls `POST /auth/logout` and clears token and username.

## Socket

There is a single connection, exported by `src/socket.ts`.

- `AuthContext` opens and closes it: when the access token changes it sets `socket.auth = { token }`
  and reconnects; when the token becomes null it disconnects.
- Pages and components only add and remove their own listeners (`socket.on` / `socket.off`
  with named functions). If they need to act on connection (`game.join`, loading lists),
  they listen to `connect` and also run the handler immediately when `socket.connected` is already true.
- Events are described in [docs/websocket.md](../docs/websocket.md).

## Persistent board

The board is not part of the pages: `PersistentBoardLayer` stays mounted under the routes,
so it can slide from the home position to the game position.
Pages drive it through `BoardTransitionContext`:

| Value                                                  | Set by     | Meaning                                                                                  |
| ------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------- |
| `mode`                                                 | each page  | `home` (decorative board on the right), `game` (interactive board), `hidden` (invisible) |
| `transitioning`                                        | `HomePage` | animation from home to game while navigating to a new game                               |
| `color`                                                | `GamePage` | side shown at the bottom; spectators see the board from white                            |
| `position`, `fen`                                      | `GamePage` | position to draw, and FEN used by chess.js to show legal moves and check                 |
| `onMove`, `onResign`                                   | `GamePage` | callbacks that emit `game.move` and `game.resign`                                        |
| `topTime`, `bottomTime`, `topRunning`, `bottomRunning` | `GamePage` | values of the two clocks                                                                 |

## Game page

- Joins the room with `game.join` and renders every `game.state` it receives.
- The board shows the legal moves with chess.js, but the move is only a request:
  the new position arrives with the next `game.state`.
- The clocks run locally (`Timer`, 100 ms tick) only after both players moved once,
  for the side to move, and are re-synchronized with every `game.state`.
- When `finishedAt` is set, `DialogEndGame` shows the result and goes back to the home page.

## Conventions

- Functional components and hooks, MUI `sx` for styles, colors from the theme (`theme.palette.chess`).
- API calls live in `src/api/`; components never build URLs themselves.
- Types that mirror backend DTOs (`Game`, `Move`, `Profile`, ...) are kept in the API modules
  and must follow the backend when it changes.
