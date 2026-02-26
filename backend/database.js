const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'spotify.db'));

// Initialize tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT,
    password_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Songs table (static data)
  db.run(`CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    artist TEXT,
    audio_url TEXT,
    image_url TEXT
  )`);

  // Likes table
  db.run(`CREATE TABLE IF NOT EXISTS likes (
    user_id INTEGER,
    song_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, song_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (song_id) REFERENCES songs(id)
  )`);

  // Playlists table
  db.run(`CREATE TABLE IF NOT EXISTS playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // Playlist_songs table
  db.run(`CREATE TABLE IF NOT EXISTS playlist_songs (
    playlist_id INTEGER,
    song_id INTEGER,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, song_id),
    FOREIGN KEY (playlist_id) REFERENCES playlists(id),
    FOREIGN KEY (song_id) REFERENCES songs(id)
  )`);

  // Insert some sample songs if none exist
  db.get(`SELECT COUNT(*) as count FROM songs`, (err, row) => {
    if (row.count === 0) {
      const sampleSongs = [
        ['Mountain Echo', 'The Helix', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'data:image/svg+xml,...'], // use your SVG
        ['Valley Breeze', 'Lunar Drift', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'data:image/svg+xml,...'],
        // ... add all 8 songs
      ];
      const stmt = db.prepare('INSERT INTO songs (title, artist, audio_url, image_url) VALUES (?, ?, ?, ?)');
      sampleSongs.forEach(song => stmt.run(song));
      stmt.finalize();
    }
  });
});

module.exports = db;