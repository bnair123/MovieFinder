import { Command } from 'commander';
import inquirer from 'inquirer';
import { searchMedia, getWatchProviders } from './api.js';
import { expandCountryList, COUNTRY_CONTINENT_ORDER } from './utils.js';
import { getSeasonsAvailability } from './seasonutils.js'; 
import { requestMedia } from './jellyseerr.js';
import dotenv from 'dotenv';
dotenv.config();

const TARGET_PROVIDERS = ['Netflix', 'Disney Plus', 'HBO Max', 'Amazon Prime Video'];

const program = new Command();

program
  .version('1.0.0')
  .arguments('<query>')
  .action(async (query) => {
    await searchAndDisplayMedia(query);
  });

program.parse(process.argv);

async function searchAndDisplayMedia(query) {
  const results = await searchMedia(query);

  if (!results.length) {
    console.log('No results found.');
    return;
  }

  // Allow user to select the correct media if multiple results
  const choices = results.map((item, index) => {
    const title = item.title || item.name;
    const releaseDate = item.release_date || item.first_air_date || 'Unknown';
    const mediaType = item.media_type;  // movie, tv, person (filter out 'person')
    return {
      name: `${title} (${releaseDate}) [${mediaType}]`,
      value: { index, mediaType },
    };
  });

  const { selectedMedia } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedMedia',
      message: 'Select the correct media:',
      choices: choices.filter(choice => choice.value.mediaType !== 'person'),
    },
  ]);

  const media = results[selectedMedia.index];
  const mediaId = media.id;
  const mediaType = selectedMedia.mediaType;
  const title = media.title || media.name;
  const overview = media.overview;
  const posterPath = media.poster_path
    ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
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
      seasonsAvailability.sort((a, b) => {
        const countryPriority =
          countryOrder.indexOf(a.Country) - countryOrder.indexOf(b.Country);
        if (countryPriority !== 0) return countryPriority;
        return b.SeasonsAvailable.length - a.SeasonsAvailable.length;
      });

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

    const uniqueAvailability = availability.filter(
      (v, i, a) =>
        a.findIndex(
          (t) => t.Country === v.Country && t.Provider === v.Provider
        ) === i
    );

    console.log('Available on the following providers:\n');
    uniqueAvailability.forEach((item) => {
      console.log(
        `Country: ${item.Country}, Provider: ${item.Provider}, Link: ${item.Link}`
      );
    });
  }

  const { shouldRequest } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldRequest',
      message: 'Do you want to request this media via Jellyseerr?',
      default: false,
    },
  ]);

  if (shouldRequest) {
    await requestMedia(mediaId, mediaType, title);
  }
}
