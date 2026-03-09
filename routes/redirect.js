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
      font-family: 'Inter', 'Helvetica Neue', sans-serif;
      background: #F9F9F7;
      color: #111111;
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
    .rule { height: 4px; background: #111111; margin-bottom: 2rem; }
    .code {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 7rem;
      font-weight: 700;
      color: #CC0000;
      line-height: 1;
      margin-bottom: 0.75rem;
    }
    .label {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #737373;
      margin-bottom: 1rem;
    }
    h1 {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    p {
      font-family: Georgia, 'Times New Roman', serif;
      color: #737373;
      font-size: 1rem;
      line-height: 1.6;
      font-style: italic;
      margin-bottom: 2rem;
    }
    a {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: #111111;
      color: #F9F9F7;
      text-decoration: none;
      border-radius: 0;
      font-weight: 600;
      font-size: 0.8rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      transition: background 0.2s ease, transform 0.1s ease;
    }
    a:hover { background: #CC0000; }
    a:active { transform: scale(0.98); }
    .rule-bottom { height: 1px; background: #111111; margin-top: 2rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="rule"></div>
    <div class="label">THE SNIP GAZETTE — ERROR DISPATCH</div>
    <div class="code">404</div>
    <h1>Link Not Found</h1>
    <p>The short link you're looking for doesn't exist or may have been removed.</p>
    <a href="/">← BACK TO HOME</a>
    <div class="rule-bottom"></div>
  </div>
</body>
</html>`;
}

module.exports = router;
