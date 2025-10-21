export interface PostalCodeLocation {
  postalCode: string;
  city: string;
  country: string;
  state?: string;
}

const countryCodeMap: Record<string, string> = {
  'AT': 'at',
  'DE': 'de',
  'CH': 'ch',
};

export const lookupCity = async (postalCode: string, country: string): Promise<string | null> => {
  const locations = await searchCitiesByPostalCode(postalCode, country);
  return locations.length > 0 ? locations[0].city : null;
};

export const searchCitiesByPostalCode = async (
  postalCode: string,
  country: string
): Promise<PostalCodeLocation[]> => {
  const cleanPostalCode = postalCode.replace(/\s/g, '').trim();

  if (!cleanPostalCode || cleanPostalCode.length < 3) {
    return [];
  }

  const apiCountryCode = countryCodeMap[country];
  if (!apiCountryCode) {
    return [];
  }

  try {
    const response = await fetch(
      `https://api.zippopotam.us/${apiCountryCode}/${encodeURIComponent(cleanPostalCode)}`,
      {
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.places || !Array.isArray(data.places)) {
      return [];
    }

    return data.places.map((place: { 'place name': string; state?: string; 'post code': string }) => ({
      postalCode: place['post code'] || cleanPostalCode,
      city: place['place name'],
      country: country,
      state: place.state,
    }));
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Postal code lookup timeout');
    } else {
      console.error('Error looking up postal code:', error);
    }
    return [];
  }
};
