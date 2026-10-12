export const APP_NAME = 'ArminIR';
export const AUTH_COOKIE = 'arminir-session';
export const SESSION_DURATION_DAYS = 30;

export const ratingOptions = ['A+', 'A', 'B', 'C', 'F'] as const;
export const sideOptions = ['LONG', 'SHORT'] as const;
export const tagTypeOptions = ['SETUP', 'MISTAKE', 'EMOTION', 'EXECUTION', 'GENERAL'] as const;
export const futuresSymbols = ['NQ', 'MNQ', 'ES', 'MES', 'YM', 'MYM'] as const;

export const futuresPointValues: Record<(typeof futuresSymbols)[number], number> = {
  NQ: 20,
  MNQ: 2,
  ES: 50,
  MES: 5,
  YM: 5,
  MYM: 0.5,
};

export function getPointValueForSymbol(symbol?: string | null) {
  if (!symbol) return 1;
  const normalized = symbol.toUpperCase() as keyof typeof futuresPointValues;
  return futuresPointValues[normalized] ?? 1;
}
