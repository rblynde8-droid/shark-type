const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, wpm, accuracy, level } = req.body;
  if (!username || wpm == null || accuracy == null || !level) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const existing = await sql`SELECT wpm FROM scores WHERE username = ${username}`;

    if (existing.length > 0) {
      if (wpm > existing[0].wpm) {
        await sql`
          UPDATE scores
          SET wpm = ${wpm}, accuracy = ${accuracy}, level = ${level}, updated_at = NOW()
          WHERE username = ${username}
        `;
        return res.status(200).json({ updated: true, improved: true });
      }
      return res.status(200).json({ updated: false, improved: false });
    } else {
      await sql`
        INSERT INTO scores (username, wpm, accuracy, level)
        VALUES (${username}, ${wpm}, ${accuracy}, ${level})
      `;
      return res.status(200).json({ updated: true, improved: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
};
