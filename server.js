import express from 'express';
import session from 'express-session';
import ConnectPgSimple from 'connect-pg-simple';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import redirectRoutes from './routes/redirect.js';
import pool from './database.js'; // to pass to session store

dotenv.config();

const pgSession = ConnectPgSimple(session);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration using connect-pg-simple
app.use(session({
    store: new pgSession({
        pool: pool,
        createTableIfMissing: true
    }),
    secret: 'super-secret-production-key-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    }
}));

// Route for static files (vanilla HTML/JS/CSS frontend)
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Redirect Route / Short URL resolution (must come after APIs and statics)
app.use('/', redirectRoutes);

// Fallback for SPA routing to dashboard or index
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running smoothly on http://localhost:${PORT}`);
});
