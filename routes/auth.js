import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../database.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password || password.length < 6) {
        return res.status(400).json({ error: 'Valid username, email, and password (min 6 chars) are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username',
            [username, email, hashedPassword]
        );

        // Auto-login after registration
        req.session.userId = result.rows[0].id;
        req.session.username = result.rows[0].username;

        res.status(201).json({ message: 'User registered successfully', username: result.rows[0].username });
    } catch (error) {
        if (error.code === '23505') { // Postgres unique violation
            res.status(409).json({ error: 'Username or email already exists' });
        } else {
            console.error('Registration Error:', error);
            res.status(500).json({ error: 'Internal server error during registration' });
        }
    }
});

// Login user
router.post('/login', async (req, res) => {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
        return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $1',
            [loginId]
        );
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;

        res.json({ message: 'Logged in successfully', username: user.username });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

// Get current user session
router.get('/me', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({
            isAuthenticated: true,
            user: { id: req.session.userId, username: req.session.username }
        });
    } else {
        res.json({ isAuthenticated: false });
    }
});

// Logout user
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'Could not log out' });
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

export default router;
