// utils.js

// Mapping continents to country codes
const CONTINENT_COUNTRY_MAP = {
    EU: [
      'AL', 'AD', 'AT', 'BY', 'BE', 'BA', 'BG', 'HR', 'CY', 'CZ',
      'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT',
      'LV', 'LI', 'LT', 'LU', 'MK', 'MT', 'MD', 'MC', 'ME', 'NL',
      'NO', 'PL', 'PT', 'RO', 'RU', 'SM', 'RS', 'SK', 'SI', 'ES',
      'SE', 'CH', 'TR', 'UA', 'GB', 'VA'
    ],
    NA: ['US', 'CA', 'MX'],
    SA: ['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'GY', 'PY', 'PE', 'SR', 'UY', 'VE'],
    OC: ['AU', 'NZ', 'FJ', 'PG', 'SB', 'VU'],
    AS: [
      'AF', 'AM', 'AZ', 'BH', 'BD', 'BT', 'BN', 'KH', 'CN', 'GE',
      'IN', 'ID', 'IR', 'IQ', 'IL', 'JP', 'JO', 'KZ', 'KW', 'KG',
      'LA', 'LB', 'MY', 'MV', 'MN', 'MM', 'NP', 'KP', 'OM', 'PK',
      'PH', 'QA', 'SA', 'SG', 'KR', 'LK', 'SY', 'TW', 'TJ', 'TH',
      'TL', 'TM', 'AE', 'UZ', 'VN', 'YE'
    ],
  };
  
 // Pref countries order
export const COUNTRY_CONTINENT_ORDER = [
  'NL', // Netherlands
  'CH', // Switzerland
  'DE', // Germany
  'GB', // United Kingdom
  'US', // United States
  'IN', // India
  'EU', // Europe
  'NA', // North America
  'SA', // South America
  'OC', // Oceania
  'AS', // Asia
];
  
// Function to expand the country list
export function expandCountryList(orderList) {
  const expandedList = [];
  for (const item of orderList) {
    if (CONTINENT_COUNTRY_MAP[item]) {
      for (const code of CONTINENT_COUNTRY_MAP[item]) {
        if (!expandedList.includes(code)) {
          expandedList.push(code);
        }
      }
    } else if (!expandedList.includes(item)) {
      expandedList.push(item);
    }
  }
  return expandedList;
}

export { CONTINENT_COUNTRY_MAP };