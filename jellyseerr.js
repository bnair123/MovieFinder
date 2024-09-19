import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const JELLYSEERR_URL = process.env.JELLYSEERR_URL;
const JELLYSEERR_API_KEY = process.env.JELLYSEERR_API_KEY;

export async function requestMedia(mediaId, mediaType, title) {
  const url = `${JELLYSEERR_URL}/api/v1/request`;

  // Debugging: Log the payload and request URL
  console.log('Making request to Jellyseerr with the following data:');
  console.log(`URL: ${url}`);
  console.log(`Payload:`, { mediaId, mediaType, title });

  const payload = {
    mediaId: mediaId,
    mediaType: mediaType === 'movie' ? 'movie' : 'tv',
    title: title,
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
    // Log the full error for better debugging
    console.error('Error requesting media:', error.response ? error.response.data : error.message);
  }
}
