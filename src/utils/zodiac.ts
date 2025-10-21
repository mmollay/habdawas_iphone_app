/**
 * Zodiac Sign Calculator
 * Calculates zodiac sign (sun sign) from birth date
 */

export interface ZodiacSign {
  name: string;
  symbol: string;
  emoji: string;
  element: 'fire' | 'earth' | 'air' | 'water';
  quality: 'cardinal' | 'fixed' | 'mutable';
  startDate: { month: number; day: number };
  endDate: { month: number; day: number };
  color: string;
  description: string;
}

export const ZODIAC_SIGNS: Record<string, ZodiacSign> = {
  aries: {
    name: 'Widder',
    symbol: '♈',
    emoji: '🐏',
    element: 'fire',
    quality: 'cardinal',
    startDate: { month: 3, day: 21 },
    endDate: { month: 4, day: 19 },
    color: '#E74C3C',
    description: 'Mutig, energisch, leidenschaftlich'
  },
  taurus: {
    name: 'Stier',
    symbol: '♉',
    emoji: '🐂',
    element: 'earth',
    quality: 'fixed',
    startDate: { month: 4, day: 20 },
    endDate: { month: 5, day: 20 },
    color: '#27AE60',
    description: 'Zuverlässig, geduldig, praktisch'
  },
  gemini: {
    name: 'Zwillinge',
    symbol: '♊',
    emoji: '👯',
    element: 'air',
    quality: 'mutable',
    startDate: { month: 5, day: 21 },
    endDate: { month: 6, day: 20 },
    color: '#F39C12',
    description: 'Vielseitig, kommunikativ, neugierig'
  },
  cancer: {
    name: 'Krebs',
    symbol: '♋',
    emoji: '🦀',
    element: 'water',
    quality: 'cardinal',
    startDate: { month: 6, day: 21 },
    endDate: { month: 7, day: 22 },
    color: '#95A5A6',
    description: 'Fürsorglich, intuitiv, emotional'
  },
  leo: {
    name: 'Löwe',
    symbol: '♌',
    emoji: '🦁',
    element: 'fire',
    quality: 'fixed',
    startDate: { month: 7, day: 23 },
    endDate: { month: 8, day: 22 },
    color: '#E67E22',
    description: 'Selbstbewusst, großzügig, kreativ'
  },
  virgo: {
    name: 'Jungfrau',
    symbol: '♍',
    emoji: '👩',
    element: 'earth',
    quality: 'mutable',
    startDate: { month: 8, day: 23 },
    endDate: { month: 9, day: 22 },
    color: '#16A085',
    description: 'Analytisch, ordentlich, hilfsbereit'
  },
  libra: {
    name: 'Waage',
    symbol: '♎',
    emoji: '⚖️',
    element: 'air',
    quality: 'cardinal',
    startDate: { month: 9, day: 23 },
    endDate: { month: 10, day: 22 },
    color: '#3498DB',
    description: 'Harmonisch, diplomatisch, gerecht'
  },
  scorpio: {
    name: 'Skorpion',
    symbol: '♏',
    emoji: '🦂',
    element: 'water',
    quality: 'fixed',
    startDate: { month: 10, day: 23 },
    endDate: { month: 11, day: 21 },
    color: '#8E44AD',
    description: 'Intensiv, leidenschaftlich, mystisch'
  },
  sagittarius: {
    name: 'Schütze',
    symbol: '♐',
    emoji: '🏹',
    element: 'fire',
    quality: 'mutable',
    startDate: { month: 11, day: 22 },
    endDate: { month: 12, day: 21 },
    color: '#9B59B6',
    description: 'Optimistisch, abenteuerlustig, philosophisch'
  },
  capricorn: {
    name: 'Steinbock',
    symbol: '♑',
    emoji: '🐐',
    element: 'earth',
    quality: 'cardinal',
    startDate: { month: 12, day: 22 },
    endDate: { month: 1, day: 19 },
    color: '#34495E',
    description: 'Diszipliniert, ehrgeizig, verantwortungsbewusst'
  },
  aquarius: {
    name: 'Wassermann',
    symbol: '♒',
    emoji: '🏺',
    element: 'air',
    quality: 'fixed',
    startDate: { month: 1, day: 20 },
    endDate: { month: 2, day: 18 },
    color: '#1ABC9C',
    description: 'Innovativ, unabhängig, humanitär'
  },
  pisces: {
    name: 'Fische',
    symbol: '♓',
    emoji: '🐟',
    element: 'water',
    quality: 'mutable',
    startDate: { month: 2, day: 19 },
    endDate: { month: 3, day: 20 },
    color: '#5DADE2',
    description: 'Einfühlsam, künstlerisch, spirituell'
  }
};

/**
 * Calculate zodiac sign from birth date
 */
export function calculateZodiacSign(birthDate: string): ZodiacSign | null {
  if (!birthDate) return null;

  const date = new Date(birthDate + 'T00:00:00');
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getDate();

  for (const [_, sign] of Object.entries(ZODIAC_SIGNS)) {
    const { startDate, endDate } = sign;

    // Handle signs that span across year boundary (e.g., Capricorn)
    if (startDate.month > endDate.month) {
      // Sign spans New Year
      if (
        (month === startDate.month && day >= startDate.day) ||
        (month === endDate.month && day <= endDate.day) ||
        (month > startDate.month || month < endDate.month)
      ) {
        return sign;
      }
    } else {
      // Normal sign within same year
      if (
        (month === startDate.month && day >= startDate.day) ||
        (month === endDate.month && day <= endDate.day) ||
        (month > startDate.month && month < endDate.month)
      ) {
        return sign;
      }
    }
  }

  return null;
}

/**
 * Get element color
 */
export function getElementColor(element: string): string {
  const colors: Record<string, string> = {
    fire: '#E74C3C',
    earth: '#27AE60',
    air: '#3498DB',
    water: '#5DADE2'
  };
  return colors[element] || '#95A5A6';
}

/**
 * City coordinates lookup for ascendant calculation
 * Includes major cities in Austria, Germany, Switzerland, and other regions
 */
const CITY_COORDINATES: Record<string, { lat: number; lon: number; name: string }> = {
  // Austria
  'wien': { lat: 48.2082, lon: 16.3738, name: 'Wien' },
  'vienna': { lat: 48.2082, lon: 16.3738, name: 'Wien' },
  'graz': { lat: 47.0707, lon: 15.4395, name: 'Graz' },
  'linz': { lat: 48.3064, lon: 14.2861, name: 'Linz' },
  'salzburg': { lat: 47.8095, lon: 13.0550, name: 'Salzburg' },
  'innsbruck': { lat: 47.2692, lon: 11.4041, name: 'Innsbruck' },
  'klagenfurt': { lat: 46.6247, lon: 14.3054, name: 'Klagenfurt' },
  'villach': { lat: 46.6111, lon: 13.8558, name: 'Villach' },
  'wels': { lat: 48.1667, lon: 14.0167, name: 'Wels' },
  'sankt pölten': { lat: 48.2000, lon: 15.6333, name: 'St. Pölten' },
  'st. pölten': { lat: 48.2000, lon: 15.6333, name: 'St. Pölten' },
  'dornbirn': { lat: 47.4125, lon: 9.7417, name: 'Dornbirn' },
  'steyr': { lat: 48.0333, lon: 14.4167, name: 'Steyr' },
  // Germany
  'berlin': { lat: 52.5200, lon: 13.4050, name: 'Berlin' },
  'münchen': { lat: 48.1351, lon: 11.5820, name: 'München' },
  'munich': { lat: 48.1351, lon: 11.5820, name: 'München' },
  'hamburg': { lat: 53.5511, lon: 9.9937, name: 'Hamburg' },
  'köln': { lat: 50.9375, lon: 6.9603, name: 'Köln' },
  'cologne': { lat: 50.9375, lon: 6.9603, name: 'Köln' },
  'frankfurt': { lat: 50.1109, lon: 8.6821, name: 'Frankfurt' },
  'stuttgart': { lat: 48.7758, lon: 9.1829, name: 'Stuttgart' },
  'düsseldorf': { lat: 51.2277, lon: 6.7735, name: 'Düsseldorf' },
  // Switzerland
  'zürich': { lat: 47.3769, lon: 8.5417, name: 'Zürich' },
  'zurich': { lat: 47.3769, lon: 8.5417, name: 'Zürich' },
  'genf': { lat: 46.2044, lon: 6.1432, name: 'Genf' },
  'geneva': { lat: 46.2044, lon: 6.1432, name: 'Genf' },
  'basel': { lat: 47.5596, lon: 7.5886, name: 'Basel' },
  'bern': { lat: 46.9480, lon: 7.4474, name: 'Bern' },
  'lausanne': { lat: 46.5197, lon: 6.6323, name: 'Lausanne' },
  // Other major cities
  'london': { lat: 51.5074, lon: -0.1278, name: 'London' },
  'paris': { lat: 48.8566, lon: 2.3522, name: 'Paris' },
  'rome': { lat: 41.9028, lon: 12.4964, name: 'Rom' },
  'roma': { lat: 41.9028, lon: 12.4964, name: 'Rom' },
  'madrid': { lat: 40.4168, lon: -3.7038, name: 'Madrid' },
  'new york': { lat: 40.7128, lon: -74.0060, name: 'New York' },
  'tokyo': { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
  'sydney': { lat: -33.8688, lon: 151.2093, name: 'Sydney' },
};

/**
 * Get coordinates from birth place string
 */
function getCoordinates(birthPlace?: string): { lat: number; lon: number } | null {
  if (!birthPlace) {
    // Default to Vienna if no place specified
    return { lat: 48.2082, lon: 16.3738 };
  }

  // Normalize input: lowercase, remove special characters
  const normalized = birthPlace.toLowerCase()
    .replace(/[,]/g, ' ')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ä/g, 'a')
    .replace(/ß/g, 'ss')
    .trim();

  // Try exact match first
  if (CITY_COORDINATES[normalized]) {
    return { lat: CITY_COORDINATES[normalized].lat, lon: CITY_COORDINATES[normalized].lon };
  }

  // Try partial match (e.g., "Wien, Österreich" should match "wien")
  for (const [key, value] of Object.entries(CITY_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized.split(' ')[0])) {
      return { lat: value.lat, lon: value.lon };
    }
  }

  // Default to Vienna
  return { lat: 48.2082, lon: 16.3738 };
}

/**
 * Calculate Julian Date from date
 */
function calculateJulianDate(date: Date): number {
  const a = Math.floor((14 - (date.getUTCMonth() + 1)) / 12);
  const y = date.getUTCFullYear() + 4800 - a;
  const m = (date.getUTCMonth() + 1) + 12 * a - 3;

  let jd = date.getUTCDate() + Math.floor((153 * m + 2) / 5) + 365 * y +
           Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  // Add time fraction
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const timeFraction = (hours - 12) / 24 + minutes / 1440 + seconds / 86400;

  return jd + timeFraction;
}

/**
 * Calculate Greenwich Mean Sidereal Time in degrees
 */
function calculateGMST(jd: number): number {
  const t = (jd - 2451545.0) / 36525.0;

  // GMST at 0h UT in degrees
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
             0.000387933 * t * t - (t * t * t) / 38710000.0;

  // Normalize to 0-360
  gmst = gmst % 360;
  if (gmst < 0) gmst += 360;

  return gmst;
}

/**
 * Calculate Local Sidereal Time in degrees
 */
function calculateLST(gmst: number, longitude: number): number {
  let lst = gmst + longitude;

  // Normalize to 0-360
  lst = lst % 360;
  if (lst < 0) lst += 360;

  return lst;
}

/**
 * Calculate ascendant sign from LST and latitude using the Placidus house system
 */
function calculateAscendantSign(lst: number, latitude: number): ZodiacSign | null {
  // Obliquity of the ecliptic (approximately 23.44 degrees)
  const epsilon = 23.43928;

  // Convert to radians
  const lstRad = (lst * Math.PI) / 180;
  const latRad = (latitude * Math.PI) / 180;
  const epsilonRad = (epsilon * Math.PI) / 180;

  // Calculate ascendant using the formula:
  // tan(Asc) = cos(LST) / (-sin(epsilon) * tan(lat) + cos(epsilon) * sin(LST))
  const denominator = -Math.sin(epsilonRad) * Math.tan(latRad) + Math.cos(epsilonRad) * Math.sin(lstRad);
  const tanAsc = Math.cos(lstRad) / denominator;

  let ascendant = Math.atan(tanAsc) * (180 / Math.PI);

  // Adjust quadrant based on cosine of LST
  if (Math.cos(lstRad) < 0) {
    ascendant += 180;
  }
  if (ascendant < 0) {
    ascendant += 360;
  }

  // Normalize to 0-360
  ascendant = ascendant % 360;

  // Map to zodiac sign (each sign is 30 degrees)
  // Aries starts at 0°, Taurus at 30°, etc.
  const signs: (keyof typeof ZODIAC_SIGNS)[] = [
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
    'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
  ];

  const signIndex = Math.floor(ascendant / 30);
  const signKey = signs[signIndex];

  return ZODIAC_SIGNS[signKey] || null;
}

/**
 * Calculate ascendant (rising sign) from birth data
 *
 * The ascendant is the zodiac sign rising on the eastern horizon at the moment of birth.
 * This calculation requires:
 * - Exact birth date and time
 * - Birth location (uses city lookup or defaults to Vienna)
 * - Birth timezone (for UTC conversion)
 *
 * Uses astronomical formulas to calculate Local Sidereal Time and determine
 * which zodiac sign was ascending at birth.
 */
export function calculateAscendant(
  birthDate: string,
  birthTime: string,
  birthTimezone: string,
  birthPlace?: string
): ZodiacSign | null {
  try {
    // Validate inputs
    if (!birthDate || !birthTime) {
      return null;
    }

    // Get coordinates (uses city lookup or defaults to Vienna)
    const coords = getCoordinates(birthPlace);
    if (!coords) {
      return null;
    }

    // Parse date and time
    const [year, month, day] = birthDate.split('-').map(Number);
    const [hours, minutes] = birthTime.split(':').map(Number);

    if (!year || !month || !day || hours === undefined || minutes === undefined) {
      return null;
    }

    // Create date in local timezone
    // Note: This is a simplified conversion. For production use, consider using a timezone library
    const birthDateTime = new Date(year, month - 1, day, hours, minutes, 0);

    // Convert to UTC - simplified approach
    // In production, use a library like date-fns-tz for accurate timezone conversion
    const utcDate = new Date(birthDateTime.toISOString());

    // Calculate Julian Date
    const jd = calculateJulianDate(utcDate);

    // Calculate Greenwich Mean Sidereal Time
    const gmst = calculateGMST(jd);

    // Calculate Local Sidereal Time
    const lst = calculateLST(gmst, coords.lon);

    // Calculate and return ascendant sign
    const ascendantSign = calculateAscendantSign(lst, coords.lat);

    return ascendantSign;
  } catch (error) {
    console.error('Error calculating ascendant:', error);
    return null;
  }
}
