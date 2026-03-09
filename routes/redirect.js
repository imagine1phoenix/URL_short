const express = require('express');
const db = require('../database');

const router = express.Router();

// Prepared statements
const findByCode = db.prepare(
    'SELECT * FROM links WHERE short_code = ?'
);
const incrementClicks = db.prepare(
    'UPDATE links SET clicks = clicks + 1 WHERE short_code = ?'
);

/**
 * GET /:shortCode
 * Redirect to the original URL and increment click count
 */
router.get('/:shortCode', (req, res) => {
    const { shortCode } = req.params;

    // Only process alphanumeric codes of length 7
    if (!/^[a-zA-Z0-9]{7}$/.test(shortCode)) {
        return res.status(404).send(generate404Page());
    }

    try {
        const link = findByCode.get(shortCode);

        if (!link) {
            return res.status(404).send(generate404Page());
        }

        // Atomically increment the click counter
        incrementClicks.run(shortCode);

        // 302 redirect to the original URL
        res.redirect(302, link.original_url);
    } catch (err) {
        console.error('Redirect error:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * Generate a styled 404 page
 */
function generate404Page() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 — Link Not Found</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #0a0a0b;
      color: #f1f1f1;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .container {
      max-width: 480px;
      padding: 2rem;
    }
    .code {
      font-size: 6rem;
      font-weight: 700;
      background: linear-gradient(135deg, #8b5cf6, #3b82f6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }
    p {
      color: #71717a;
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    a {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: #fff;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.95rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    a:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(139, 92, 246, 0.3);
    }
    a:active { transform: scale(0.98); }
  </style>
</head>
<body>
  <div class="container">
    <div class="code">404</div>
    <h1>Link Not Found</h1>
    <p>The short link you're looking for doesn't exist or may have been removed.</p>
    <a href="/">← Back to Home</a>
  </div>
</body>
</html>`;
}

module.exports = router;
