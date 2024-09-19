// api.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Cache duration in milliseconds (e.g., 24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

let db;

// Initialize the database
async function initializeDb() {
  if (!db) {
    const dbModule = await import('./db.js');
    db = await dbModule.initializeDatabase();
  }
  return db;
}

// Function to perform a unified search (movies, TV shows, people)
export async function searchMedia(query) {
    const url = `${TMDB_BASE_URL}/search/multi`;
    const params = {
      api_key: API_KEY,
      query: query,
    };
  
    try {
      const response = await axios.get(url, { params });
      return response.data.results || [];
    } catch (error) {
      console.error('Error searching media:', error.message);
      return [];
    }
  }

// Function to get data from cache
async function getFromCache(mediaId, mediaType) {
  await initializeDb();
  const row = await db.get(
    'SELECT data, timestamp FROM media_cache WHERE media_id = ? AND media_type = ?',
    [mediaId, mediaType]
  );
  if (row && Date.now() - row.timestamp < CACHE_DURATION) {
    return JSON.parse(row.data);
  } else {
    // Remove outdated cache
    await db.run(
      'DELETE FROM media_cache WHERE media_id = ? AND media_type = ?',
      [mediaId, mediaType]
    );
    return null;
  }
}

// Function to save data to cache
async function saveToCache(mediaId, mediaType, data) {
  await initializeDb();
  await db.run(
    'INSERT OR REPLACE INTO media_cache (media_id, media_type, data, timestamp) VALUES (?, ?, ?, ?)',
    [mediaId, mediaType, JSON.stringify(data), Date.now()]
  );
}

// Function to get watch providers
export async function getWatchProviders(mediaId, mediaType = 'movie') {
  // Try to get data from cache
  const cachedData = await getFromCache(mediaId, mediaType);
  if (cachedData) {
    return cachedData;
  }

  // If not in cache, fetch from API
  const url = `${TMDB_BASE_URL}/${mediaType}/${mediaId}/watch/providers`;
  const params = {
    api_key: API_KEY,
  };
  try {
    console.log(`Getting watch providers for ${mediaType} ID: ${mediaId}`);
    console.log(`Making request to: ${url}`);
    console.log(`With API key: ${API_KEY}`);

    const response = await axios.get(url, { params });
    const data = response.data.results || {};

    // Save to cache
    await saveToCache(mediaId, mediaType, data);

    return data;
  } catch (error) {
    console.error('Error getting watch providers:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return {};
  }
}