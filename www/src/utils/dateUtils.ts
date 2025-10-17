export function getRelativeTimeString(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Gerade eben';
  } else if (diffMins < 60) {
    return `Vor ${diffMins} Minute${diffMins > 1 ? 'n' : ''}`;
  } else if (diffHours < 24) {
    return `Vor ${diffHours} Stunde${diffHours > 1 ? 'n' : ''}`;
  } else if (diffDays === 1) {
    return 'Gestern';
  } else if (diffDays < 7) {
    return `Vor ${diffDays} Tagen`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Vor ${weeks} Woche${weeks > 1 ? 'n' : ''}`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `Vor ${months} Monat${months > 1 ? 'en' : ''}`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `Vor ${years} Jahr${years > 1 ? 'en' : ''}`;
  }
}
