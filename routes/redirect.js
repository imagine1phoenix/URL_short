import express from 'express';
import pool from '../database.js';

const router = express.Router();

router.get('/:shortCode', async (req, res, next) => {
  const { shortCode } = req.params;

  if (shortCode === 'api' || shortCode === 'css' || shortCode === 'js' || shortCode === 'dashboard.html' || shortCode === 'index.html') {
    return next();
  }

  try {
    const result = await pool.query('SELECT * FROM links WHERE short_code = $1', [shortCode]);
    const link = result.rows[0];

    if (!link) {
      return res.status(404).send(`
                <html>
                    <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #111111; color: #f9f9f7;">
                        <div style="text-align: center; border: 1px solid #f9f9f7; padding: 2rem;">
                            <h1 style="color: #ef4444;">404 Not Found</h1>
                            <p>The short link you provided does not exist.</p>
                        </div>
                    </body>
                </html>
            `);
    }

    if (link.is_active === 0) {
      return res.status(403).send(`
                <html>
                     <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #111111; color: #f9f9f7;">
                         <div style="text-align: center; border: 1px solid #f9f9f7; padding: 2rem;">
                            <h1 style="color: #f59e0b;">Link Inactive</h1>
                            <p>This short link has been disabled by its owner.</p>
                        </div>
                    </body>
                </html>
            `);
    }

    if (link.max_clicks !== null && link.clicks >= link.max_clicks) {
      return res.status(410).send(`
                <html>
                     <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #111111; color: #f9f9f7;">
                         <div style="text-align: center; border: 1px solid #f9f9f7; padding: 2rem;">
                            <h1 style="color: #ef4444;">Link Expired</h1>
                            <p>This short link has reached its maximum click limit and is no longer available.</p>
                        </div>
                    </body>
                </html>
            `);
    }

    const now = new Date().toISOString();
    await pool.query('UPDATE links SET clicks = clicks + 1, last_accessed_at = $1 WHERE id = $2', [now, link.id]);

    res.redirect(link.original_url);

  } catch (error) {
    console.error('Redirection Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
