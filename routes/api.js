const express = require('express');
const { customAlphabet } = require('nanoid');
const db = require('../database');

const router = express.Router();

// Custom nanoid with alphanumeric alphabet, 7 characters
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const generateCode = customAlphabet(alphabet, 7);

// Prepared statements for performance
const insertLink = db.prepare(
    'INSERT INTO links (original_url, short_code) VALUES (?, ?)'
);
const findByCode = db.prepare(
    'SELECT * FROM links WHERE short_code = ?'
);
const findAllLinks = db.prepare(
    'SELECT * FROM links ORDER BY created_at DESC'
);

/**
 * POST /api/shorten
 * Create a new shortened URL
 */
router.post('/shorten', (req, res) => {
    const { url } = req.body;

    // Validate that a URL was provided
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
        return res.status(400).json({
            error: 'Please provide a valid URL.'
        });
    }

    // Validate URL format using the URL constructor
    try {
        const parsed = new URL(url.trim());
        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return res.status(400).json({
                error: 'Only HTTP and HTTPS URLs are supported.'
            });
        }
    } catch (err) {
        return res.status(400).json({
            error: 'Invalid URL format. Please enter a valid URL including the protocol (e.g., https://example.com).'
        });
    }

    // Generate a unique short code with collision check
    let shortCode;
    let attempts = 0;
    const maxAttempts = 10;

    do {
        shortCode = generateCode();
        const existing = findByCode.get(shortCode);
        if (!existing) break;
        attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
        return res.status(500).json({
            error: 'Failed to generate a unique short code. Please try again.'
        });
    }

    // Insert the new link into the database
    try {
        const result = insertLink.run(url.trim(), shortCode);

        // Build the full short URL
        const protocol = req.protocol;
        const host = req.get('host');
        const shortUrl = `${protocol}://${host}/${shortCode}`;

        // Fetch the newly created record
        const link = db.prepare('SELECT * FROM links WHERE id = ?').get(result.lastInsertRowid);

        res.status(201).json({
            id: link.id,
            originalUrl: link.original_url,
            shortCode: link.short_code,
            shortUrl: shortUrl,
            clicks: link.clicks,
            createdAt: link.created_at
        });
    } catch (err) {
        console.error('Database error:', err.message);
        res.status(500).json({
            error: 'An internal server error occurred.'
        });
    }
});

/**
 * GET /api/links
 * Retrieve all shortened links sorted by creation date (newest first)
 */
router.get('/links', (req, res) => {
    try {
        const links = findAllLinks.all();
        const protocol = req.protocol;
        const host = req.get('host');

        const response = links.map(link => ({
            id: link.id,
            originalUrl: link.original_url,
            shortCode: link.short_code,
            shortUrl: `${protocol}://${host}/${link.short_code}`,
            clicks: link.clicks,
            createdAt: link.created_at
        }));

        res.json(response);
    } catch (err) {
        console.error('Database error:', err.message);
        res.status(500).json({
            error: 'An internal server error occurred.'
        });
    }
});

module.exports = router;
