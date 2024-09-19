import { Command } from 'commander';
import inquirer from 'inquirer';
import { searchMedia, getWatchProviders } from './api.js';
import { expandCountryList, COUNTRY_CONTINENT_ORDER } from './utils.js';
import { getSeasonsAvailability } from './seasonutils.js';  // Ensure this matches the actual file name
import dotenv from 'dotenv';
dotenv.config();


const TARGET_PROVIDERS = ['Netflix', 'Disney Plus', 'HBO Max', 'Amazon Prime Video'];

const program = new Command();

program
  .version('1.0.0')
  .option('-t, --type <type>', 'Media type (movie or tv)', 'movie')
  .arguments('<query>')
  .action(async (query, options) => {
    const mediaType = options.type;
    await searchAndDisplayMedia(query, mediaType);
  });

program.parse(process.argv);


async function searchAndDisplayMedia(query, mediaType) {
  const results = await searchMedia(query, mediaType);

  if (!results.length) {
    console.log('No results found.');
    return;
  }

  // Allow user to select the correct media if multiple results
  const choices = results.map((item, index) => {
    const title = item.title || item.name;
    const releaseDate = item.release_date || item.first_air_date || 'Unknown';
    return {
      name: `${title} (${releaseDate})`,
      value: index,
    };
  });

  const { selectedIndex } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedIndex',
      message: 'Select the correct media:',
      choices,
    },
  ]);

  const selectedMedia = results[selectedIndex];
  const mediaId = selectedMedia.id;
  const title = selectedMedia.title || selectedMedia.name;
  const overview = selectedMedia.overview;
  const posterPath = selectedMedia.poster_path
    ? `https://image.tmdb.org/t/p/w500${selectedMedia.poster_path}`
    : 'N/A';

  console.log(`\nTitle: ${title}`);
  console.log(`Overview: ${overview}`);
  console.log(`Poster: ${posterPath}\n`);

  // Get watch providers
  const providers = await getWatchProviders(mediaId, mediaType);

  // Expand country list
  const countryOrder = expandCountryList(COUNTRY_CONTINENT_ORDER);

  if (mediaType === 'tv') {
    const seasonsAvailability = await getSeasonsAvailability(
      mediaId,
      providers,
      countryOrder,
      TARGET_PROVIDERS
    );

    if (seasonsAvailability.length) {
      // Prioritize based on the number of seasons available
      seasonsAvailability.sort((a, b) => {
        // Priority based on country order and number of seasons
        const countryPriority =
          countryOrder.indexOf(a.Country) - countryOrder.indexOf(b.Country);
        if (countryPriority !== 0) return countryPriority;

        // More seasons available
        return b.SeasonsAvailable.length - a.SeasonsAvailable.length;
      });

      // Display the results
      console.log('Available seasons on the following providers:\n');
      seasonsAvailability.forEach((item) => {
        console.log(
          `Country: ${item.Country}, Provider: ${item.Provider}, Seasons: ${item.SeasonsAvailable.join(
            ', '
          )}, Link: ${item.Link}`
        );
      });
    } else {
      console.log('No seasons availability information found.');
    }
  } else {
    // For movies, display regular availability
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

    if (!availability.length) {
      console.log('No available providers found for your criteria.');
      return;
    }

    // Remove duplicates
    const uniqueAvailability = availability.filter(
      (v, i, a) =>
        a.findIndex(
          (t) => t.Country === v.Country && t.Provider === v.Provider
        ) === i
    );

    // Display the results
    console.log('Available on the following providers:\n');
    uniqueAvailability.forEach((item) => {
      console.log(
        `Country: ${item.Country}, Provider: ${item.Provider}, Link: ${item.Link}`
      );
    });
  }

  // Ask if the user wants to request the media via Jellyseerr
  const { shouldRequest } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldRequest',
      message: 'Do you want to request this media via Jellyseerr?',
      default: false,
    },
  ]);

  if (shouldRequest) {
    await requestMedia(mediaId, mediaType);
  }
}

async function requestMedia(mediaId, mediaType) {
  // Implement the logic to request media via Jellyseerr
  console.log(`Requesting ${mediaType} with ID ${mediaId} via Jellyseerr...`);
  // Add your Jellyseerr API call here
}