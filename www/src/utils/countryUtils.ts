export const getDefaultCountryCode = (): string => {
  const hostname = window.location.hostname;
  if (hostname.includes('habdawas.de')) {
    return 'DE';
  }
  return 'AT';
};

export const getDefaultCountry = (): string => {
  return getDefaultCountryCode();
};
