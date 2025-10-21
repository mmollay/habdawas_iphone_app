export interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

export const countries: Country[] = [
  { code: 'AT', name: 'Österreich', flag: '🇦🇹', dialCode: '+43' },
  { code: 'DE', name: 'Deutschland', flag: '🇩🇪', dialCode: '+49' },
  { code: 'CH', name: 'Schweiz', flag: '🇨🇭', dialCode: '+41' },
];
