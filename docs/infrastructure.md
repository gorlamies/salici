# Application Infrastructure

This document describes the current infrastructure of Salici.
It evolves alongside the application.

## Development Environment

The application runs in five Docker containers, defined in `compose.yaml`:

```mermaid
flowchart TD
    Browser["User browser"]

    subgraph Docker["Development · Docker Compose"]
        Frontend["frontend · React + Vite · :5173"]
        Nginx["nginx · reverse proxy · host :3000"]
        Backend["backend · NestJS · :3000 · one or more instances"]
        Redis[("redis · socket.io adapter")]
        Database[("postgres · PostgreSQL · :5432")]
    end

    Browser -->|"Load the application"| Frontend
    Browser <-->|"HTTP API + WebSocket"| Nginx
    Nginx <-->|"proxy_pass"| Backend
    Backend <-->|"Pub/sub of socket.io events"| Redis
    Backend <-->|"Queries and persistence · Prisma"| Database
```

## Responsibilities

| Container | Image                                      | Responsibility                                                                                                      |
| --------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| frontend  | `frontend/dockerfile` (node:22-alpine)     | Vite dev server. Serves the React application, which runs in the user's browser.                                    |
| nginx     | nginx:alpine                               | Single entry point for the backend on host port 3000. Forwards HTTP and WebSocket upgrades.                         |
| backend   | `backend/dockerfile` (node:22-alpine)      | Authoritative server: authentication, move validation, clocks, ratings, broadcasts.                                 |
| redis     | redis:7-alpine                             | Message bus of the socket.io Redis adapter, so that every backend instance can reach every socket.                  |
| postgres  | `postgres/dockerfile` (postgres:18-alpine) | Persists users, games, moves, follows and ratings. Reachable only by the backend (and by local tools on port 5432). |

## Communication

- The browser loads the React application from the frontend container.
- The application sends REST requests and opens one WebSocket connection to `VITE_BACKEND_URL`,
  which is nginx (`http://localhost:3000`).
- nginx forwards everything to the `backend` service (`upstream backend_cluster`),
  including the `Upgrade` and `Connection` headers needed by WebSocket.
- The backend reaches the other services by their Compose service names
  (`postgres`, `redis`), never `localhost`.
- The backend is the source of truth for game state and uses Prisma to access PostgreSQL.
- The frontend never connects directly to the database or to Redis.

## Why nginx and Redis

The backend can run as more than one instance:

```bash
docker compose up -d --scale backend=2
docker compose restart nginx
```

- The backend port is not published on a fixed host port (`ports: - "3000"`), so several instances can coexist.
- nginx balances the requests among the instances (round robin).
- The two players of a game may be connected to different instances. The socket.io Redis adapter
  (`backend/src/redis-io.adapter.ts`) publishes every `emit` to a room on Redis, so all instances deliver it.
  `fetchSockets()` (used for the online status and for the first-move countdown) also sees the sockets of the other instances.
- The client uses only the `websocket` transport (no long polling), so a connection never needs to
  come back to the same instance and nginx needs no sticky sessions.
- Scheduled work runs on every instance: the time-out cron of each instance checks every game.
  Updates are conditional, so a game is closed and rated only once
  (see [game-lifecycle.md](game-lifecycle.md)).

nginx resolves the name `backend` only when it starts: after scaling, or when a backend container is recreated
with a new address, restart nginx.

## Volumes

| Volume                           | Mounted in                               | Purpose                                                                                                                                                 |
| -------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `postgres_data` (named)          | postgres `/var/lib/postgresql`           | Database data survives `docker compose down` and container recreation. `docker compose down -v` deletes it.                                             |
| `./backend` (bind mount)         | backend `/app`                           | Source code from the host, with automatic reload (`nodemon --legacy-watch`, polling).                                                                   |
| `./frontend` (bind mount)        | frontend `/app`                          | Source code from the host, with hot reload (`CHOKIDAR_USEPOLLING`).                                                                                     |
| anonymous                        | backend and frontend `/app/node_modules` | Keeps the `node_modules` installed in the Linux image instead of the host ones. Renew it with `docker compose up --build -V` after a dependency change. |
| `./nginx/nginx.conf` (read only) | nginx `/etc/nginx/nginx.conf`            | Proxy configuration.                                                                                                                                    |

Polling is needed because Docker Desktop on Windows does not forward file change events
from the Windows file system to the containers.

## Start order

- `backend` waits for `postgres` (`pg_isready`) and `redis` (`redis-cli ping`) to be healthy.
- At start the backend runs `prisma migrate deploy`, then the NestJS application.
  If Redis is unreachable or `REDIS_URL` is missing, the backend does not start.
- `nginx` starts after the backend container (not after it is ready).
- `frontend` does not depend on the other services.

## Environment variables

Each service reads its own `.env` file (ignored by git); the committed `.env.example` files document them.

| File            | Variable                                            | Example                                                    | Use                                                                      |
| --------------- | --------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| `backend/.env`  | `PORT`                                              | `3000`                                                     | Port of the NestJS server inside the container                           |
|                 | `FRONTEND_URL`                                      | `http://localhost:5173`                                    | Allowed origin for CORS (HTTP with credentials, and WebSocket)           |
|                 | `DATABASE_URL`                                      | `postgres://chess_user:chess_password@postgres:5432/chess` | Prisma connection, host `postgres`                                       |
|                 | `JWT_ACCESS_SECRET`                                 | long random string                                         | Signs the access tokens                                                  |
|                 | `JWT_REFRESH_SECRET`                                | another long random string                                 | Signs the refresh tokens                                                 |
|                 | `REDIS_URL`                                         | `redis://redis:6379`                                       | socket.io Redis adapter, required                                        |
| `frontend/.env` | `VITE_BACKEND_URL`                                  | `http://localhost:3000`                                    | URL of nginx used by the browser                                         |
|                 | `PORT`                                              | `5173`                                                     | Not read by Vite (the port is the Vite default)                          |
| `postgres/.env` | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | `chess_user`, `chess_password`, `chess`                    | Created at the first start of an empty volume; must match `DATABASE_URL` |

Changing `POSTGRES_*` after the first start has no effect on an existing volume.

## Development only

This configuration is meant for local development:

- the backend runs TypeScript directly (`ts-node --transpile-only`), without a build;
- the refresh cookie is not `secure` (no HTTPS);
- PostgreSQL is published on the host;
- Swagger is always enabled at `/api`;
- there are no health checks for the backend, nginx and the frontend (`GET /health` only reports that the process is alive).
