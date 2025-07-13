# API Endpoints

This document outlines the available API endpoints and their functions.

## Authentication

*   `/api/auth/[...nextauth]`

    This route is handled by NextAuth.js and provides the following endpoints for authentication:

    *   `GET /api/auth/signin`: Renders the sign-in page.
    *   `POST /api/auth/signin/:provider`: Initiates the sign-in flow for a specific provider (e.g., Discord).
    *   `GET /api/auth/callback/:provider`: Handles the callback from the OAuth provider.
    *   `GET /api/auth/signout`: Renders the sign-out page.
    *   `POST /api/auth/signout`: Signs the user out.
    *   `GET /api/auth/session`: Returns the current session.
    *   `GET /api/auth/csrf`: Returns the CSRF token.
    *   `GET /api/auth/error`: Renders the error page.

## Challenges

*   `/api/challenges`

    This endpoint is for managing challenges. (The implementation details are not yet available in the provided code.)

## Summoners

*   `/api/summoners`

    This endpoint is for managing summoner data. (The implementation details are not yet available in the provided code.)

## Users

*   `/api/users`

    This endpoint is for managing user data. (The implementation details are not yet available in the provided code.)
