const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const db = new Database(path.join(__dirname, 'scores.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    wpm REAL NOT NULL,
    accuracy REAL NOT NULL,
    level TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const getLeaderboard = db.prepare(
  'SELECT username, wpm, accuracy, level, updated_at as date FROM scores ORDER BY wpm DESC LIMIT 200'
);

const getByUsername = db.prepare('SELECT * FROM scores WHERE username = ?');

const insertScore = db.prepare(
  'INSERT INTO scores (username, wpm, accuracy, level) VALUES (?, ?, ?, ?)'
);

const updateScore = db.prepare(
  'UPDATE scores SET wpm = ?, accuracy = ?, level = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?'
);

app.get('/api/leaderboard', (req, res) => {
  try {
    const rows = getLeaderboard.all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/score', (req, res) => {
  const { username, wpm, accuracy, level } = req.body;
  if (!username || wpm == null || accuracy == null || !level) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const existing = getByUsername.get(username);
    if (existing) {
      if (wpm > existing.wpm) {
        updateScore.run(wpm, accuracy, level, username);
        return res.json({ updated: true, improved: true });
      }
      return res.json({ updated: false, improved: false });
    } else {
      insertScore.run(username, wpm, accuracy, level);
      return res.json({ updated: true, improved: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(PORT, () => {
  console.log(`SharkType server running on http://localhost:${PORT}`);
});
