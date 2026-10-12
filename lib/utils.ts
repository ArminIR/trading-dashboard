import { clsx, type ClassValue } from 'clsx';
import { format } from 'date-fns';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function formatNumber(value: number, digits = 2) {
  return Number(value || 0).toFixed(digits);
}

export function formatDate(value: Date | string, pattern = 'MMM d, yyyy') {
  return format(new Date(value), pattern);
}

export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  try {
    if (!value) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
