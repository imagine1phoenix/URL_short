import express from 'express';
import { nanoid } from 'nanoid';
import pool from '../database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use('/links', requireAuth);

// 1. Create a new short link
router.post('/links', async (req, res) => {
    const { original_url, max_clicks } = req.body;
    const user_id = req.session.userId;

    if (!original_url) {
        return res.status(400).json({ error: 'Original URL is required' });
    }

    try {
        new URL(original_url);
    } catch (e) {
        return res.status(400).json({ error: 'Invalid URL format. Please include http:// or https://' });
    }

    const customAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let short_code;
    let isUnique = false;

    while (!isUnique) {
        short_code = nanoid(7);
        const existing = await pool.query('SELECT id FROM links WHERE short_code = $1', [short_code]);
        if (existing.rows.length === 0) isUnique = true;
    }

    const maxClicksValue = max_clicks && parseInt(max_clicks) > 0 ? parseInt(max_clicks) : null;

    try {
        const result = await pool.query(
            `INSERT INTO links (user_id, original_url, short_code, max_clicks, is_active)
             VALUES ($1, $2, $3, $4, 1) RETURNING *`,
            [user_id, original_url, short_code, maxClicksValue]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating link:', error);
        res.status(500).json({ error: 'Failed to create short link' });
    }
});

// 2. Get all links for the authenticated user
router.get('/links', async (req, res) => {
    const user_id = req.session.userId;
    try {
        const result = await pool.query('SELECT * FROM links WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching links:', error);
        res.status(500).json({ error: 'Failed to fetch links' });
    }
});

// 3. Update an existing link (Destination URL, Status, Max Clicks)
router.put('/links/:id', async (req, res) => {
    const linkId = req.params.id;
    const user_id = req.session.userId;
    const { original_url, is_active } = req.body;

    try {
        const linkRes = await pool.query('SELECT * FROM links WHERE id = $1 AND user_id = $2', [linkId, user_id]);
        if (linkRes.rows.length === 0) {
            return res.status(404).json({ error: 'Link not found or unauthorized' });
        }

        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (original_url !== undefined) {
            try {
                new URL(original_url);
                updates.push(`original_url = $${paramIndex++}`);
                params.push(original_url);
            } catch (e) {
                return res.status(400).json({ error: 'Invalid URL format' });
            }
        }

        if (is_active !== undefined) {
            updates.push(`is_active = $${paramIndex++}`);
            params.push(is_active ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        params.push(linkId, user_id);
        const query = `UPDATE links SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING *`;

        const updateRes = await pool.query(query, params);
        res.json(updateRes.rows[0]);
    } catch (error) {
        console.error('Error updating link:', error);
        res.status(500).json({ error: 'Failed to update link' });
    }
});

// 4. Delete a link
router.delete('/links/:id', async (req, res) => {
    const linkId = req.params.id;
    const user_id = req.session.userId;

    try {
        const result = await pool.query('DELETE FROM links WHERE id = $1 AND user_id = $2', [linkId, user_id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Link not found or unauthorized' });
        }
        res.json({ message: 'Link deleted successfully' });
    } catch (error) {
        console.error('Error deleting link:', error);
        res.status(500).json({ error: 'Failed to delete link' });
    }
});

export default router;
