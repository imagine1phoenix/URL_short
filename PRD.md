# URL Shortener Product Requirements Document (PRD)

## Project Overview
A production-ready URL shortener web application with authentication, link management, and analytics features. The application uses a monolithic architecture with a Node.js/Express backend and a vanilla HTML/CSS/JS frontend styled like a newspaper editorial layout.

## Features & Requirements

### Authentication
- User Registration (username, email, password)
- User Login
- Secure password hashing (`bcryptjs`)
- Session-based authentication (`express-session` + `connect-pg-simple`)
- Logout functionality

### Link Management
- Short code generation (7-character alphanumeric using `nanoid`)
- Store original URL and short code mapping
- Custom link expiry limit (max clicks)
- Enable/disable link toggle (pause/unpause)
- Edit destination URL for existing short links
- Track creation timestamp
- Track last accessed timestamp
- View analytics (clicks) per link

### URL Redirection
- Redirect short code to original URL if link is active and under max clicks limit.
- Display "Link Expired" if max clicks reached.
- Display "Link Paused" if link is paused.
- Update `last_accessed_at` and increment `clicks` on successful redirect.

## Minimum Viable Product (MVP) Scope
1. Database Schema (`users` and `links` tables).
2. Backend REST APIs for auth and links.
3. Frontend UI (Login/Register, Dashboard).
4. Redirection logic.

## Technical Details

### Backend
- Node.js + Express
- PostgreSQL Serverless DB via Neon (`pg` node package)

### Frontend (Editorial/Newsprint UI)
- Vanilla HTML, CSS, JS
- Multi-page SPA structure
- Brutalist constraints: Zero border radius, strict Times/Inter/JetBrains typography.
- Monochrome palette: `#F9F9F7` background, `#111111` text/buttons, `#CC0000` accents.
- `index.html` (Landing/Auth - Newspaper style layout)
- `dashboard.html` (Protected Dashboard - Grid structure)

### Database Schema (Neon PostgreSQL)

**users**
- `id` (SERIAL PRIMARY KEY)
- `username` (VARCHAR(255) UNIQUE NOT NULL)
- `email` (VARCHAR(255) UNIQUE NOT NULL)
- `password` (VARCHAR(255) NOT NULL)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**links**
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE)
- `original_url` (TEXT NOT NULL)
- `short_code` (VARCHAR(50) UNIQUE NOT NULL)
- `clicks` (INTEGER DEFAULT 0)
- `max_clicks` (INTEGER DEFAULT NULL)
- `is_active` (SMALLINT DEFAULT 1)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `last_accessed_at` (TIMESTAMP DEFAULT NULL)
