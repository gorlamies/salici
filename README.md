# Salici

Salici is a web application for playing chess online.
Two registered users play a game in real time, with an optional clock;
finished games update a Glicko-2 rating for each time category.

The server is authoritative: the browser only sends move requests,
the backend validates them with chess.js, keeps the clocks and decides the result.

## Stack

| Part              | Technology                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Frontend          | React 19, TypeScript, Vite, MUI, socket.io-client, chess.js (only to show the legal moves) |
| Backend           | Node.js 22, TypeScript, NestJS, socket.io, chess.js, Prisma                                |
| Database          | PostgreSQL 18                                                                              |
| Realtime          | WebSocket (socket.io) with the Redis adapter                                               |
| Reverse proxy     | nginx, in front of the backend                                                             |
| Local environment | Docker Compose                                                                             |

## Documentation

| Document                                         | Content                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------ |
| [docs/infrastructure.md](docs/infrastructure.md) | Containers, network, volumes, environment variables                            |
| [docs/authentication.md](docs/authentication.md) | Access and refresh tokens, WebSocket authentication, frontend session handling |
| [docs/api.md](docs/api.md)                       | REST endpoints, requests, responses and errors                                 |
| [docs/websocket.md](docs/websocket.md)           | Realtime events, rooms and error format                                        |
| [docs/game-lifecycle.md](docs/game-lifecycle.md) | Game states, clock, time out, concurrency, ratings                             |
| [docs/database.md](docs/database.md)             | Prisma schema, migrations, Prisma client                                       |
| [frontend/README.md](frontend/README.md)         | Structure of the React application                                             |

The REST API is also described by Swagger at <http://localhost:3000/api> while the backend is running.

## Requirements

- Docker Desktop (or Docker Engine) with Docker Compose.
- Node.js 22 and npm on the host are optional: they are needed only to install
  new dependencies and to give the editor the types of the packages (see below).

## First start

1. Create the three environment files from their examples:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   cp postgres/.env.example postgres/.env
   ```

   On Windows PowerShell use `Copy-Item` instead of `cp`.
   Replace `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` with two different long random strings.
   The `.env` files are ignored by git: never commit real secrets.

2. Build and start everything:

   ```bash
   docker compose up --build
   ```

   At every start the backend applies the pending migrations (`prisma migrate deploy`)
   and then starts NestJS with automatic reload.

3. Generate the Prisma client. It is not committed (`backend/src/generated/prisma` is in `.gitignore`)
   and the start script does not generate it:

   ```bash
   docker compose exec backend npx prisma generate
   ```

   The files are written through the bind mount into `backend/src/generated/prisma`,
   nodemon sees the change and restarts the backend.

4. Open <http://localhost:5173>, sign up two users (two browsers, or a normal and a private window)
   and create a game from the home page by writing the username of the opponent.

## Services and ports

| Service                    | URL on the host         | Notes                                              |
| -------------------------- | ----------------------- | -------------------------------------------------- |
| Frontend (Vite dev server) | <http://localhost:5173> | Hot reload through polling (`CHOKIDAR_USEPOLLING`) |
| Backend through nginx      | <http://localhost:3000> | REST API, WebSocket and Swagger (`/api`)           |
| PostgreSQL                 | `localhost:5432`        | Published for local database tools                 |
| Redis                      | not published           | Used only by the backend                           |

The backend container listens on port 3000, but on the host it is reachable only through nginx
(see [docs/infrastructure.md](docs/infrastructure.md)).

## Everyday commands

All commands run from the root of the repository.

| Task                              | Command                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------- |
| Start in the background           | `docker compose up -d`                                                            |
| Follow the logs of a service      | `docker compose logs -f backend`                                                  |
| Stop everything                   | `docker compose down`                                                             |
| Type-check the backend            | `docker compose exec backend npx tsc --noEmit`                                    |
| Run the backend tests             | `docker compose exec backend npm test`                                            |
| Type-check and build the frontend | `docker compose exec frontend npm run build`                                      |
| Lint the frontend                 | `docker compose exec frontend npm run lint`                                       |
| Open a SQL shell                  | `docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'` |

The backend runs with `ts-node --transpile-only`: type errors do not stop it,
so run the type-check before every commit.

### After a `git pull`

- If `backend/prisma/schema.prisma` or a migration changed: the migration is applied at the next start of the backend,
  but the client must be generated again with `docker compose exec backend npx prisma generate`.
- If a `package.json` changed: rebuild the service and renew its anonymous `node_modules` volume:

  ```bash
  docker compose up -d --build -V backend
  ```

  `-V` (`--renew-anon-volumes`) is required: without it the old `node_modules` volume survives
  and hides the new packages installed in the image.

### Adding a dependency

Install it on the host, inside the folder of the service, so that `package.json`, `package-lock.json`
and the types for the editor are updated:

```bash
cd backend
npm install <package>
cd ..
docker compose up -d --build -V backend
```

The same works for `frontend`.

### Database changes

Change `backend/prisma/schema.prisma`, then create and apply the migration
(this also generates the client):

```bash
docker compose exec backend npx prisma migrate dev --name <short_name>
```

Commit the new folder in `backend/prisma/migrations`. See [docs/database.md](docs/database.md).

### Cleaning the database

- Delete only the games (the ratings stay as they are):

  ```sql
  DELETE FROM "Move";
  DELETE FROM "Game";
  ```

- Delete everything, users included, and apply all the migrations again:

  ```bash
  docker compose exec backend npx prisma migrate reset
  ```

## Repository structure

```text
.
├── compose.yaml          # the local environment
├── nginx/nginx.conf      # reverse proxy in front of the backend
├── postgres/             # database image and its .env
├── backend/
│   ├── prisma/           # schema.prisma and migrations
│   └── src/
│       ├── auth/         # signup, login, refresh, logout, JWT guard
│       ├── chess/        # wrapper of chess.js (rules, FEN, SAN, UCI)
│       ├── clock/        # clock arithmetic and time categories
│       ├── games/        # REST controller, WebSocket gateway, game service, time-out cron
│       ├── profile/      # profiles, game history, follows, account settings
│       ├── rating/       # Glicko-2
│       ├── database/     # Prisma service
│       ├── health/       # GET /health
│       └── swagger/      # Swagger setup
├── frontend/             # React application, see frontend/README.md
└── docs/                 # documentation
```

## Workflow

- Work on a branch, open a pull request to `main`; the author merges it with a merge commit.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`).
- Code, comments and documentation are written in English.
