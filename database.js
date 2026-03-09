import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize database tables
const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS links (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          original_url TEXT NOT NULL,
          short_code VARCHAR(50) UNIQUE NOT NULL,
          clicks INTEGER DEFAULT 0,
          max_clicks INTEGER DEFAULT NULL,
          is_active SMALLINT DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_accessed_at TIMESTAMP DEFAULT NULL
      );
    `);
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    client.release();
  }
};

initDB();

export default pool;
