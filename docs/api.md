# REST API

Base URL in development: `http://localhost:3000` (nginx in front of the backend).
Swagger UI with the same endpoints: <http://localhost:3000/api>.

All bodies are JSON. Protected endpoints need `Authorization: Bearer <access token>`.
The request bodies are not validated by a pipe yet: the checks listed below are the only ones.

## Errors

Errors use the default NestJS format:

```json
{
  "statusCode": 409,
  "message": "The requested move is not legal.",
  "error": "Conflict"
}
```

| Status | Meaning in this API                                                      |
| ------ | ------------------------------------------------------------------------ |
| 400    | Malformed or invalid input                                               |
| 401    | Missing, invalid or expired token; wrong credentials                     |
| 403    | Authenticated but not allowed (not your game, wrong password)            |
| 404    | The game or the user does not exist                                      |
| 409    | Conflict with the current state (email already in use, game not running) |
| 500    | Unexpected error, details only in the server logs                        |

NestJS answers `201 Created` to every `POST` that does not set another status,
even where Swagger shows 200.

## Health

### `GET /health`

Liveness only: the process answers, the database is not checked.

```json
{ "status": "ok" }
```

## Auth

### `POST /auth/signup`

Body: `{ "username": string, "email": string, "password": string }`.
Answer: `201` with an empty body. Any failure (also duplicates): `400 Unable to create user`.

### `POST /auth/login`

Body: `{ "username": string, "password": string }`.
Answer: `201` with `{ "accessToken": string }` and the `refresh_token` cookie.
Wrong credentials or closed account: `401 Invalid username or password`.

### `POST /auth/refresh`

No body; needs the `refresh_token` cookie (`credentials: "include"`).
Answer: `201` with `{ "accessToken": string }`; the cookie is replaced when it expires in less than one day.
Missing or invalid cookie, unknown or closed user: `401`.

### `GET /auth/me` · protected

Answer: `{ "username": string }`, taken from the token.

### `POST /auth/logout`

Not protected. Clears the refresh cookie. Answer: `201` with `{ "message": "Logged out" }`.

## Games

All endpoints are protected.

### `POST /games`

Creates a game between two existing users; colors are drawn at random.

```json
{
  "playerOneUsername": "alice",
  "playerTwoUsername": "bob",
  "initialTimeMs": 180000,
  "incrementMs": 2000
}
```

`initialTimeMs` and `incrementMs` are both numbers (a game with a clock) or both null or missing
(a game without a clock).

Answer: `201` with `{ "gameId": string }`. Both players then receive `game.created` on the socket.

| Error | When                                                                                      |
| ----- | ----------------------------------------------------------------------------------------- |
| 403   | The caller is not one of the two players                                                  |
| 400   | The two usernames are equal                                                               |
| 400   | One of the users does not exist                                                           |
| 400   | Only one of the two time values is given                                                  |
| 400   | A time value is not an integer, or both are 0                                             |
| 400   | `initialTimeMs` outside 0–10 800 000 (180 min) or `incrementMs` outside 0–180 000 (180 s) |

### `GET /games/:id`

Any logged user can read any game. Answer: a `GameDto`. Unknown id: `404`.

### `GET /games`

The `ready` and `running` games of the caller, newest first. Answer: `GameDto[]`.

### `GameDto`

```json
{
  "id": "cmg...",
  "state": "running",
  "initialFen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "currentFen": "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
  "createdAt": "2026-10-08T18:00:00.000Z",
  "finishedAt": null,
  "whitePlayerUsername": "alice",
  "blackPlayerUsername": "bob",
  "initialTimeMs": 180000,
  "incrementMs": 2000,
  "timeCategory": "blitz",
  "timeLabel": "3+2",
  "whiteRemainingMs": 176400,
  "blackRemainingMs": 180000,
  "firstMoveRemainingMs": null,
  "moves": [
    {
      "moveNumber": 1,
      "from": "e2",
      "to": "e4",
      "promotion": null,
      "san": "e4",
      "uci": "e2e4",
      "fenAfter": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      "createdAt": "2026-10-08T18:00:05.000Z",
      "remainingMsAfter": 180000
    },
    {
      "moveNumber": 2,
      "from": "e7",
      "to": "e5",
      "promotion": null,
      "san": "e5",
      "uci": "e7e5",
      "fenAfter": "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
      "createdAt": "2026-10-08T18:00:09.000Z",
      "remainingMsAfter": 180000
    }
  ]
}
```

(The first move of each side is played in the `ready` phase, when the clocks do not move:
see [game-lifecycle.md](game-lifecycle.md).)

| Field                                        | Notes                                                                                                           |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `state`                                      | A value of `GameState`, see [game-lifecycle.md](game-lifecycle.md)                                              |
| `finishedAt`                                 | Set when the game ends, whatever the reason                                                                     |
| `whitePlayerUsername`, `blackPlayerUsername` | Nullable in the schema, always set by `POST /games`                                                             |
| `initialTimeMs`, `incrementMs`               | Null for a game without a clock                                                                                 |
| `timeCategory`, `timeLabel`                  | `bullet`…`unlimited`; label like `3+2`, `0.5+0` or `∞`                                                          |
| `whiteRemainingMs`, `blackRemainingMs`       | Null without a clock. While `running`, the value of the side to move is computed at the moment the DTO is built |
| `firstMoveRemainingMs`                       | Only in `ready`, once the first-move countdown has started; otherwise null                                      |
| `moves`                                      | Ordered by `moveNumber` (1 = first white move); `remainingMsAfter` is the mover's time after the move           |

Moves are not sent with REST: they go through the `game.move` WebSocket event (see [websocket.md](websocket.md)).

## Profile

All endpoints are protected. `me` always means the user of the token.

### `GET /profile/:username`

```json
{
  "username": "alice",
  "createdAt": "2026-10-07T20:00:00.000Z",
  "closedAt": null,
  "ratings": [
    { "timeCategory": "bullet", "rating": 1500, "provisional": true },
    { "timeCategory": "blitz", "rating": 1623, "provisional": false }
  ],
  "ongoingGameId": "cmg...",
  "followedByMe": false,
  "email": "alice@example.com",
  "hideOnlineStatus": false
}
```

- `ratings` always contains the five categories, in the order of the `TimeCategory` enum;
  a category never played shows 1500 provisional. `provisional` means deviation above 110.
- `ongoingGameId` is the newest `ready` or `running` game of the user, or null.
- `email` and `hideOnlineStatus` are present only in your own profile.
- Closed accounts are still visible, with `closedAt` set.
- Unknown user: `404`.

### `GET /profile/:username/games`

One page of the games of a user (all states, aborted included), newest first.

| Query      | Default | Notes                                     |
| ---------- | ------- | ----------------------------------------- |
| `limit`    | 10      | Integer between 1 and 50, otherwise `400` |
| `cursor`   | none    | `nextCursor` of the previous page         |
| `category` | all     | A `TimeCategory`, otherwise `400`         |

```json
{
  "games": [
    {
      "id": "cmg...",
      "state": "white_win",
      "createdAt": "...",
      "finishedAt": "...",
      "whitePlayerUsername": "alice",
      "blackPlayerUsername": "bob",
      "currentFen": "...",
      "timeCategory": "blitz",
      "timeLabel": "3+2",
      "whiteRatingBefore": 1500,
      "whiteRatingAfter": 1662,
      "blackRatingBefore": 1500,
      "blackRatingAfter": 1338
    }
  ],
  "nextCursor": "cmf..."
}
```

`nextCursor` is null on the last page. The rating fields are null for games that were not rated.
Unknown user: `404`.

### `GET /profile/me/following`

The users you follow, closed accounts excluded, online first and then by name:
`[{ "username": "bob", "online": true }]`.
Users who hide their online status always appear offline.

### `POST /profile/:username/follow` and `DELETE /profile/:username/follow`

Answer: `204`. Following is one-way and idempotent; unfollowing a user you do not follow also answers 204.
Errors on follow: `400` yourself, `404` unknown or closed user.

### `PATCH /profile/me/password`

Body: `{ "currentPassword": string, "newPassword": string }`. Answer: `204`.
Wrong current password: `403 Wrong password`.

### `PATCH /profile/me/email`

Body: `{ "currentPassword": string, "newEmail": string }`. Answer: `{ "email": string }`.
Errors: `403` wrong password, `409 Email already in use`.

### `PATCH /profile/me/settings`

Body: `{ "hideOnlineStatus": boolean }`. Answer: `{ "hideOnlineStatus": boolean }`.
The followers are notified immediately (`friend.offline` when hiding, `friend.online` when showing again while connected).

### `POST /profile/me/close`

Body: `{ "currentPassword": string }`. Answer: `204`; the refresh cookie is cleared.
Wrong password: `403`. The games of a closed account stay visible.

The wrong password answers 403 and not 401 on purpose: the frontend treats a 401 as an expired token
and would refresh and retry.
