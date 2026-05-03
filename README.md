# URL Shortener

A production-ready URL shortener with user authentication, link management, and click analytics. Built with a Node.js/Express backend and a vanilla HTML/CSS/JS frontend styled as a newspaper editorial layout.

## Features

- **Authentication** — Register and log in with username or email; passwords hashed with bcryptjs; session-based via express-session + PostgreSQL session store.
- **Link Management** — Create 7-character alphanumeric short codes (nanoid), set optional max-click limits, enable/disable links, edit destination URLs, and delete links.
- **Analytics** — Per-link click counter and last-accessed timestamp.
- **Redirection** — Visiting `/<short_code>` redirects to the original URL, or shows a "Link Expired" / "Link Paused" page as appropriate.

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Runtime  | Node.js (ESM) |
| Framework | Express 4 |
| Database | PostgreSQL via [Neon](https://neon.tech) (`pg`) |
| Sessions | express-session + connect-pg-simple |
| Short codes | nanoid |
| Frontend | Vanilla HTML / CSS / JS |

## Project Structure

```
├── server.js          # App entry point, middleware, route registration
├── database.js        # PostgreSQL pool + auto table creation
├── middleware/
│   └── auth.js        # requireAuth middleware
├── routes/
│   ├── auth.js        # POST /api/auth/register|login|logout, GET /api/auth/me
│   ├── api.js         # CRUD for /api/links (protected)
│   └── redirect.js    # GET /:short_code → redirect
└── public/
    ├── index.html     # Landing / auth page
    ├── dashboard.html # Protected dashboard
    ├── css/
    └── js/
```

## Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database (e.g. a free [Neon](https://neon.tech) project)

### Installation

```bash
git clone https://github.com/imagine1phoenix/URL_short.git
cd URL_short
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<dbname>?sslmode=require
SESSION_SECRET=your-strong-secret-here
PORT=3000
```

Database tables (`users`, `links`, and the session table) are created automatically on first run.

### Run

```bash
# Production
npm start

# Development
npm run dev
```

The server starts at `http://localhost:3000`.

## API Reference

### Auth — `/api/auth`

| Method | Path        | Description               |
|--------|-------------|---------------------------|
| POST   | `/register` | Create account (auto-login) |
| POST   | `/login`    | Log in                    |
| POST   | `/logout`   | End session               |
| GET    | `/me`       | Get current session info  |

### Links — `/api/links` *(requires login)*

| Method | Path        | Description                          |
|--------|-------------|--------------------------------------|
| GET    | `/links`    | List all links for the logged-in user |
| POST   | `/links`    | Create a new short link              |
| PUT    | `/links/:id`| Update destination URL or active state |
| DELETE | `/links/:id`| Delete a link                        |

### Redirection

`GET /:short_code` — Redirects to the original URL (increments click counter), or returns a status page if the link is paused or has exceeded its max-click limit.
