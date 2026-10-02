# Authentication and Authorization

The backend authenticates users and issues two JWT tokens:
a short-lived access token and a long-lived refresh token.

Access-token validation is stateless: the backend verifies the token
without maintaining a server-side login session.

## Login Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser as Browser · React
    participant Backend as Backend · NestJS
    participant Database as PostgreSQL

    User->>Browser: Enter username and password
    Browser->>Backend: POST /auth/login · credentials
    Backend->>Database: Find user by username
    Database-->>Backend: User and stored password hash
    Backend->>Backend: Verify password against stored hash

    alt Valid credentials
        Backend->>Backend: Generate access and refresh JWTs
        Backend-->>Browser: Access token in JSON + refresh token via Set-Cookie
        Browser->>Browser: Store access token in React state
        Note over Browser: Browser stores the HttpOnly refresh cookie
    else Invalid credentials
        Backend-->>Browser: 401 Unauthorized
    end
```

## Tokens

| Token | Storage | Purpose |
|---|---|---|
| Access token | React state | Authenticate requests to protected endpoints. |
| Refresh token | HttpOnly browser cookie | Obtain a new access token without logging in again. |

The access token is sent in the `Authorization: Bearer <token>` header.

The refresh cookie cannot be read by frontend JavaScript.
The browser attaches it to matching requests when credentials are enabled.

## Access-Token Renewal

```mermaid
sequenceDiagram
    participant Browser as Browser · React
    participant Backend as Backend · NestJS

    Browser->>Backend: Protected request · access token
    Backend-->>Browser: 401 Unauthorized · expired access token
    Browser->>Backend: POST /auth/refresh · refresh cookie
    Backend->>Backend: Validate refresh token

    alt Valid refresh token
        Backend->>Backend: Generate new access token

        alt Refresh token near expiration
            Backend->>Backend: Generate new refresh token
            Backend-->>Browser: Access token + refresh token via Set-Cookie
            Note over Browser: Browser replaces the HttpOnly refresh cookie
        else Refresh token not near expiration
            Backend-->>Browser: New access token only
        end

        Browser->>Browser: Update access token in React state
        Browser->>Backend: Retry request · new access token
        Backend-->>Browser: Protected response
    else Invalid or expired refresh token
        Backend-->>Browser: 401 Unauthorized
        Browser->>Browser: Clear authentication state and require login
    end
```

Because React state is held in memory, reloading the page clears the
access token. The frontend can call `/auth/refresh` to restore authentication
while the refresh cookie remains valid.

## Authorization

The backend validates the access token before allowing access to protected
endpoints. It also checks permissions where required—for example, whether
the authenticated user is a player in a game and is allowed to make a move.

