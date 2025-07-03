import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

export const db = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_DB_TOKEN,
});

// Inicializar las tablas si no existen
export async function initializeDatabase() {
  try {
    // Crear tabla de usuarios
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de shows del usuario
   // Crear tabla de shows del usuario
await db.execute(`
  CREATE TABLE IF NOT EXISTS user_shows (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    show_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('watchlist', 'watched', 'favorites', 'watching')),
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

    console.log('✅ Base de datos Turso inicializada');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
}