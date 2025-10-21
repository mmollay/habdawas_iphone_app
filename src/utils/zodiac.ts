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
 * Note: Ascendant (Rising Sign) calculation requires:
 * - Exact birth time (hours, minutes)
 * - Birth location (latitude, longitude)
 * - Birth timezone
 * - Complex astronomical calculations
 *
 * For accurate ascendant calculation, consider using an astronomy library like:
 * - ephemeris
 * - astronomia
 * - Or connecting to an external API service
 *
 * Placeholder function for future implementation:
 */
export function calculateAscendant(
  birthDate: string,
  birthTime: string,
  birthTimezone: string,
  birthPlace?: string
): string | null {
  // TODO: Implement with astronomy library
  // This requires complex astronomical calculations
  return null;
}
