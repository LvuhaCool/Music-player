const express = require('express');
const cors = require('cors');
const db = require('./database');
const auth = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());

// ========== PUBLIC ROUTES ==========
app.post('/api/register', async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const hashed = await auth.hashPassword(password);
  db.run('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)',
    [email, name || email.split('@')[0], hashed],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already exists' });
        return res.status(500).json({ error: err.message });
      }
      const user = { id: this.lastID, email, name };
      const token = auth.generateToken(user);
      res.json({ user, token });
    }
  );
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await auth.comparePassword(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = auth.generateToken({ id: user.id, email: user.email });
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
  });
});

app.get('/api/songs', (req, res) => {
  db.all('SELECT * FROM songs', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ========== PROTECTED ROUTES ==========
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1]; // Bearer <token>
  const decoded = auth.verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Invalid token' });

  req.user = decoded;
  next();
}

// Likes
app.get('/api/me/likes', authenticate, (req, res) => {
  db.all(
    `SELECT songs.* FROM likes
     JOIN songs ON likes.song_id = songs.id
     WHERE likes.user_id = ?`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post('/api/likes', authenticate, (req, res) => {
  const { songId } = req.body;
  db.run('INSERT OR IGNORE INTO likes (user_id, song_id) VALUES (?, ?)',
    [req.user.id, songId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/likes/:songId', authenticate, (req, res) => {
  db.run('DELETE FROM likes WHERE user_id = ? AND song_id = ?',
    [req.user.id, req.params.songId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Playlists
app.get('/api/me/playlists', authenticate, (req, res) => {
  db.all('SELECT * FROM playlists WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/playlists', authenticate, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Playlist name required' });

  db.run('INSERT INTO playlists (user_id, name) VALUES (?, ?)',
    [req.user.id, name],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name });
    }
  );
});

app.get('/api/playlists/:id', authenticate, (req, res) => {
  db.get('SELECT * FROM playlists WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, playlist) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

      db.all(
        `SELECT songs.* FROM playlist_songs
         JOIN songs ON playlist_songs.song_id = songs.id
         WHERE playlist_songs.playlist_id = ?`,
        [playlist.id],
        (err, songs) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ ...playlist, songs });
        }
      );
    }
  );
});

app.post('/api/playlists/:id/songs', authenticate, (req, res) => {
  const { songId } = req.body;
  db.run('INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)',
    [req.params.id, songId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/playlists/:id/songs/:songId', authenticate, (req, res) => {
  db.run('DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?',
    [req.params.id, req.params.songId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));