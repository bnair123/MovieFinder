// server.js
const express = require('express');
const cors = require('cors');
const { searchMedia, getWatchProviders } = require('./api');
const { expandCountryList, COUNTRY_CONTINENT_ORDER } = require('./utils');

const app = express();
app.use(cors());
app.use(express.json());

const TARGET_PROVIDERS = ['Netflix', 'Disney Plus', 'HBO Max', 'Amazon Prime Video'];

app.get('/api/search', async (req, res) => {
  const { query, mediaType } = req.query;

  if (!query || !mediaType) {
    return res.status(400).json({ error: 'Missing query or mediaType parameter.' });
  }

  const results = await searchMedia(query, mediaType);
  res.json(results);
});

app.get('/api/media/:id', async (req, res) => {
  const mediaId = req.params.id;
  const { mediaType } = req.query;

  if (!mediaId || !mediaType) {
    return res.status(400).json({ error: 'Missing mediaId or mediaType parameter.' });
  }

  const providers = await getWatchProviders(mediaId, mediaType);

  // Expand country list
  const countryOrder = expandCountryList(COUNTRY_CONTINENT_ORDER);

  // Prepare availability data
  const availability = [];
  for (const countryCode of countryOrder) {
    const countryProviders = providers[countryCode];
    if (countryProviders && countryProviders.flatrate) {
      for (const provider of countryProviders.flatrate) {
        const providerName = provider.provider_name;
        if (TARGET_PROVIDERS.includes(providerName)) {
          availability.push({
            Country: countryCode,
            Provider: providerName,
            Link: countryProviders.link,
          });
        }
      }
    }
  }

  // Remove duplicates
  const uniqueAvailability = availability.filter(
    (v, i, a) =>
      a.findIndex(
        (t) => t.Country === v.Country && t.Provider === v.Provider
      ) === i
  );

  res.json({
    availability: uniqueAvailability,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
