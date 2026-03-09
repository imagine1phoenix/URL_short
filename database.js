const Database = require('better-sqlite3');
const path = require('path');

// Initialize SQLite database
const db = new Database(path.join(__dirname, 'url_shortener.db'));

// Enable WAL mode for better concurrent read/write performance
db.pragma('journal_mode = WAL');

// Create the links table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_url TEXT NOT NULL,
    short_code TEXT UNIQUE NOT NULL,
    clicks INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create index on short_code for fast lookups
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_short_code ON links(short_code)
`);

module.exports = db;
