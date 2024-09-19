// db.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db;

export async function initializeDatabase() {
  if (!db) {
    db = await open({
      filename: './media_cache.db',
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS media_cache (
        media_id TEXT,
        media_type TEXT,
        data TEXT,
        timestamp INTEGER,
        PRIMARY KEY (media_id, media_type)
      )
    `);
  }
  return db;
}