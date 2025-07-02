import express from "express";
import cors from "cors";
import { db } from "./DB.js";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());



app.post("/api/user-content", async (req, res) => {
  const { userId, contentId, status } = req.body;

  try {
    await db.execute(
      `INSERT OR IGNORE INTO UserContentStatus (user_id, content_id, status) VALUES (?, ?, ?)`,
      [userId, contentId, status]
    );

    res.status(200).json({ message: "Contenido agregado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.delete("/api/user-content", async (req, res) => {
  const { userId, contentId, status } = req.body;

  try {
    await db.execute(
      `DELETE FROM UserContentStatus WHERE user_id = ? AND content_id = ? AND status = ?`,
      [userId, contentId, status]
    );

    res.status(200).json({ message: "Contenido eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get("/api/thetvdb/token", async (req, res) => {
  try {
    const response = await fetch("https://api4.thetvdb.com/v4/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apikey: process.env.THETVDB_API_KEY }),
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
  console.log(`Server ejecutandose en http://localhost:${PORT}`);
});


// Obtener todos los IDs de contenido según estado
app.get("/api/user-content/:userId/:status", async (req, res) => {
  const { userId, status } = req.params;

  try {
    const result = await db.execute(
      `SELECT content_id FROM UserContentStatus WHERE user_id = ? AND status = ?`,
      [userId, status]
    );
    res.json(result.rows.map((r) => r.content_id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener TODAS las listas del usuario (watchlist, watched, favorites)
app.get("/api/user-content/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await db.execute(
      `SELECT content_id, status FROM UserContentStatus WHERE user_id = ?`,
      [userId]
    );

    const lists = {
      watchlist: [],
      watched: [],
      favorites: [],
    };

    result.rows.forEach(({ content_id, status }) => {
      if (lists[status]) {
        lists[status].push(content_id);
      }
    });

    res.json(lists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
