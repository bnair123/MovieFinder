// jellyseerr.js
const axios = require('axios');
require('dotenv').config();

const JELLYSEERR_URL = process.env.JELLYSEERR_URL;
const JELLYSEERR_API_KEY = process.env.JELLYSEERR_API_KEY;

// Function to request media
async function requestMedia(mediaId, mediaType) {
  const url = `${JELLYSEERR_URL}/api/v1/request`;

  const payload = {
    mediaId: Number(mediaId),
    mediaType,
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'X-Api-Key': JELLYSEERR_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (response.data) {
      console.log('Media requested successfully.');
    } else {
      console.log('Failed to request media.');
    }
  } catch (error) {
    console.error('Error requesting media:', error.message);
  }
}

module.exports = {
  requestMedia,
};
