require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create tables on startup
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS websites (
        id SERIAL PRIMARY KEY,
        url VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        last_checked TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS checks_history (
        id SERIAL PRIMARY KEY,
        website_id INTEGER REFERENCES websites(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database initialized');
  } catch (error) {
    console.error('Error initializing database', error);
  }
}
initDb();

// Routes
app.get('/api/websites', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM websites ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/websites/:id/history', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT status, checked_at FROM checks_history WHERE website_id = $1 ORDER BY checked_at DESC LIMIT 50',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/websites', async (req, res) => {
  const { url, name } = req.body;
  if (!url || !name) {
    return res.status(400).json({ error: 'URL and name are required' });
  }
  
  try {
    // Add simple url validation if needed
    const result = await pool.query(
      'INSERT INTO websites (url, name) VALUES ($1, $2) RETURNING *',
      [url, name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/websites/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM websites WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/websites/trigger', async (req, res) => {
  try {
    const response = await fetch('http://worker:3001/trigger', { method: 'POST' });
    if (response.ok) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Worker returned an error' });
    }
  } catch (error) {
    console.error('Error triggering worker:', error);
    res.status(500).json({ error: 'Could not reach worker' });
  }
});

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
