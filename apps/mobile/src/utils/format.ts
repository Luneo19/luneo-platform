export const formatCurrency = (value: number, currency: string = 'EUR'): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);

export const formatDate = (input: string | number | Date): string => {
  const date = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
