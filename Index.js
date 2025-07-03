import express from "express";
import cors from "cors";
import { db, initializeDatabase } from "./DB.js";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Inicializar base de datos al arrancar
initializeDatabase();

// Crear usuario
app.post("/api/user-shows", async (req, res) => {
  const { userId, showId, type, mediaType } = req.body;

  if (!userId || !showId || !type) {
    return res.status(400).json({ error: "userId, showId y type son requeridos" });
  }

  if (!['watchlist', 'watched', 'favorites', 'watching'].includes(type)) {
    return res.status(400).json({ error: "type debe ser watchlist, watched, favorites o watching" });
  }

  try {
    // Verificar si ya existe el show en la lista para evitar duplicados
    const existingShow = await db.execute(
      `SELECT id FROM user_shows WHERE user_id = ? AND show_id = ? AND type = ?`,
      [userId, showId, type]
    );

    if (existingShow.rows.length > 0) {
      return res.status(409).json({ error: "El show ya está en esta lista" });
    }

    const userShowId = Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO user_shows (id, user_id, show_id, type, media_type, added_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [userShowId, userId, showId, type, mediaType || 'series', now]
    );

    res.status(200).json({ message: "Show agregado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener usuario por email
app.get("/api/users/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const result = await db.execute(
      `SELECT * FROM users WHERE email = ?`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar show a lista del usuario
app.post("/api/user-shows", async (req, res) => {
  const { userId, showId, type } = req.body;

  if (!userId || !showId || !type) {
    return res.status(400).json({ error: "userId, showId y type son requeridos" });
  }

  if (!['watchlist', 'watched', 'favorites', 'watching'].includes(type)) {
    return res.status(400).json({ error: "type debe ser watchlist, watched, favorites o watching" });
  }

  try {
    const userShowId = Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    await db.execute(
      `INSERT OR REPLACE INTO user_shows (id, user_id, show_id, type, added_at) VALUES (?, ?, ?, ?, ?)`,
      [userShowId, userId, showId, type, now]
    );

    res.status(200).json({ message: "Show agregado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remover show de lista del usuario
app.delete("/api/user-shows", async (req, res) => {
  const { userId, showId, type } = req.body;

  if (!userId || !showId || !type) {
    return res.status(400).json({ error: "userId, showId y type son requeridos" });
  }

  try {
    await db.execute(
      `DELETE FROM user_shows WHERE user_id = ? AND show_id = ? AND type = ?`,
      [userId, showId, type]
    );

    res.status(200).json({ message: "Show removido correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener shows del usuario por tipo
app.get("/api/user-shows/:userId/:type", async (req, res) => {
  const { userId, type } = req.params;

  try {
    const result = await db.execute(
      `SELECT * FROM user_shows WHERE user_id = ? AND type = ? ORDER BY added_at DESC`,
      [userId, type]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener todos los shows del usuario
app.get("/api/user-shows/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await db.execute(
      `SELECT * FROM user_shows WHERE user_id = ? ORDER BY added_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar si un show está en una lista específica
app.get("/api/user-shows/:userId/:showId/:type", async (req, res) => {
  const { userId, showId, type } = req.params;

  try {
    const result = await db.execute(
      `SELECT COUNT(*) as count FROM user_shows WHERE user_id = ? AND show_id = ? AND type = ?`,
      [userId, showId, type]
    );

    const isInList = result.rows[0].count > 0;
    res.json({ isInList });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Token de TheTVDB (mantener el endpoint existente)
app.get("/api/thetvdb/token", async (req, res) => {
  try {
    const response = await fetch("https://api4.thetvdb.com/v4/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apikey: process.env.TVDB_API_KEY }),
    });

    const data = await response.json();
    if (data?.data?.token) {
      res.json({ token: data.data.token });
    } else {
      res.status(500).json({ error: "No se pudo obtener token de TheTVDB" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server ejecutándose en http://localhost:${PORT}`);
});