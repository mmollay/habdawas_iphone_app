export const conditionLabels: Record<string, string> = {
  new: 'Neu',
  like_new: 'Wie neu',
  good: 'Gut',
  acceptable: 'Akzeptabel',
  defective: 'Defekt'
};

export const conditionOptions = [
  { value: 'new', label: 'Neu' },
  { value: 'like_new', label: 'Wie neu' },
  { value: 'good', label: 'Gut' },
  { value: 'acceptable', label: 'Akzeptabel' },
  { value: 'defective', label: 'Defekt' }
];

export type ConditionKey = keyof typeof conditionLabels;

export function getConditionLabel(condition: string): string {
  return conditionLabels[condition] || condition;
}
