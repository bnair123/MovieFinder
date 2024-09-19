// seasonutils.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

let db;

// Initialize the database
async function initializeDb() {
  if (!db) {
    const dbModule = await import('./db.js');
    db = await dbModule.initializeDatabase();
  }
  return db;
}

// Function to get TV show details (including number of seasons)
async function getTVShowDetails(showId) {
  await initializeDb();
  // Try to get data from cache
  const cachedData = await getFromCache(showId, 'tv_details');
  if (cachedData) {
    return cachedData;
  }

  const url = `${TMDB_BASE_URL}/tv/${showId}`;
  const params = {
    api_key: API_KEY,
  };
  try {
    const response = await axios.get(url, { params });
    const data = response.data;

    // Save to cache
    await saveToCache(showId, 'tv_details', data);

    return data;
  } catch (error) {
    console.error('Error getting TV show details:', error.message);
    return null;
  }
}

// Function to get season availability
export async function getSeasonsAvailability(
  showId,
  providers,
  countryOrder,
  targetProviders
) {
  const showDetails = await getTVShowDetails(showId);
  if (!showDetails) return [];

  const totalSeasons = showDetails.seasons.length;
  const seasonsAvailability = [];

  for (const countryCode of countryOrder) {
    const countryProviders = providers[countryCode];
    if (countryProviders && countryProviders.flatrate) {
      for (const provider of countryProviders.flatrate) {
        const providerName = provider.provider_name;
        if (targetProviders.includes(providerName)) {
          seasonsAvailability.push({
            Country: countryCode,
            Provider: providerName,
            SeasonsAvailable: Array.from({ length: totalSeasons }, (_, i) => i + 1),
            Link: countryProviders.link,
          });
        }
      }
    }
  }

  // Remove duplicates
  const uniqueAvailability = seasonsAvailability.filter(
    (v, i, a) =>
      a.findIndex(
        (t) =>
          t.Country === v.Country && t.Provider === v.Provider
      ) === i
  );

  return uniqueAvailability;
}

// Cache functions
async function getFromCache(id, type) {
  await initializeDb();
  const row = await db.get(
    'SELECT data, timestamp FROM media_cache WHERE media_id = ? AND media_type = ?',
    [id, type]
  );
  if (row && Date.now() - row.timestamp < 24 * 60 * 60 * 1000) {
    return JSON.parse(row.data);
  } else {
    // Remove outdated cache
    await db.run(
      'DELETE FROM media_cache WHERE media_id = ? AND media_type = ?',
      [id, type]
    );
    return null;
  }
}

async function saveToCache(id, type, data) {
  await initializeDb();
  await db.run(
    'INSERT OR REPLACE INTO media_cache (media_id, media_type, data, timestamp) VALUES (?, ?, ?, ?)',
    [id, type, JSON.stringify(data), Date.now()]
  );
}