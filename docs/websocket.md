# Realtime Events (WebSocket)

The realtime part uses socket.io. The server side is `backend/src/games/games.gateway.ts`,
the client is the single socket exported by `frontend/src/socket.ts`.

## Connection

```ts
io(VITE_BACKEND_URL, { autoConnect: false, transports: ["websocket"] });
socket.auth = { token: accessToken };
socket.connect();
```

- The access token is checked once, in the handshake (see [authentication.md](authentication.md)).
  A rejected handshake arrives on `connect_error` with
  `error.data = { status_code: 401, message: "Unauthorized access" }`.
- Only the `websocket` transport is used, so several backend instances work behind nginx without sticky sessions.
- CORS allows only `FRONTEND_URL`.

## Rooms

| Room              | Joined                                                    | Used for                                          |
| ----------------- | --------------------------------------------------------- | ------------------------------------------------- |
| `user:<username>` | automatically on connection, by every socket of that user | `game.created`, `friend.online`, `friend.offline` |
| `game:<gameId>`   | on `game.join`                                            | `game.state` of that game                         |

Rooms work across backend instances thanks to the Redis adapter.
A socket leaves its rooms only when it disconnects; there is no `game.leave` yet.

## Client to server

The username is always taken from the authenticated socket, never from the payload.

### `game.join`

```json
{ "gameId": "cmg..." }
```

Any logged user can join any game (spectators included). The server:

1. loads the game (`404` on `game.error` if it does not exist);
2. adds the socket to `game:<gameId>` and sends `game.state` to this socket only;
3. if both players are now in the room and the game is `ready` with a clock whose first-move countdown has
   not started, starts it and sends `game.state` to the whole room.

A client must join again after every reconnection: it receives the full current state,
so it does not matter which events it missed.

### `game.move`

```json
{ "gameId": "cmg...", "move": { "from": "e7", "to": "e8", "promotion": "q" } }
```

`promotion` (`q`, `r`, `b`, `n`) is required when a pawn reaches the last rank.
On success the new state is sent to the whole room with `game.state`.

If the clock of the mover had already run out, the move is not applied: the game is closed
(time out, or aborted in the first-move phase) and the closed state is broadcast as a normal `game.state`.

### `game.resign`

```json
{ "gameId": "cmg..." }
```

Only the two players can resign, only while the game is `ready` or `running`.
On success the state is sent to the whole room.

## Server to client

### `game.state`

Payload: a `GameDto` (see [api.md](api.md)). It is always the complete, committed state:
clients replace what they show instead of applying differences.

Sent after `game.join`, after every move or resignation, when the first-move countdown starts,
and when the server closes a game for time (the time-out cron).

### `game.error`

```json
{ "status_code": 409, "message": "The requested move is not legal." }
```

Sent only to the socket that caused it.

| `status_code` | Examples                                                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 400           | `gameId is required`, `gameId and move are required`, `Both 'from' and 'to' are required.`                                   |
| 403           | `Unauthorized move` (not your turn or not your game), `User is not a player in this game`                                    |
| 404           | `Game <id> not found`, `Game not found`                                                                                      |
| 409           | illegal move, `The game is not running.`, concurrent move (`The game state changed while applying this move. Please retry.`) |
| 500           | `Internal server error` (details only in the server logs)                                                                    |

A 401 is never sent here: authentication errors arrive only on `connect_error`.

### `game.created`

Payload: the `GameDto` of the new game. Sent to `user:<white>` and `user:<black>`
after `POST /games`, so both players see the game in their notifications.

### `friend.online` and `friend.offline`

```json
{ "username": "bob" }
```

Sent to every follower of the user:

- `friend.online` when the user opens the first socket (any instance, any tab);
- `friend.offline` when the last socket closes;
- also when the user changes `hideOnlineStatus` (`friend.offline` when hiding,
  `friend.online` when showing again while connected).

Nothing is sent while the user hides the online status.

## Rules

- The backend remains authoritative: the gateway calls `GamesService`, which validates everything.
  The gateway contains no chess logic.
- Broadcasts happen only after the database transaction has been committed.
- Every handler catches its errors: an `HttpException` becomes a `game.error` with its status and message,
  anything else is logged and becomes a 500.
