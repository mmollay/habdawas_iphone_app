/**
 * Formatiert eine Zahl mit Tausendertrennzeichen (Punkt als Separator)
 * @param value Die zu formatierende Zahl
 * @returns Formatierte Zahl mit Punkten als Tausendertrennzeichen
 */
export const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '0';
  return value.toLocaleString('de-DE');
};

/**
 * Formatiert eine Währung mit Tausendertrennzeichen
 * @param value Der zu formatierende Betrag
 * @returns Formatierter Betrag mit € Symbol
 */
export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '0,00 €';
  return value.toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
