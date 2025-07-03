import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

export const db = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_DB_TOKEN,
});

export async function initializeDatabase() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

await db.execute(`
  CREATE TABLE IF NOT EXISTS user_shows (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    show_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('watchlist', 'watched', 'favorites', 'watching')),
    media_type TEXT DEFAULT 'series',
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    progress TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

    console.log('\u2705 Base de datos Turso inicializada');
  } catch (error) {
    console.error('\u274c Error inicializando base de datos:', error);
  }
}