import { differenceInMinutes } from 'date-fns';
import { getPointValueForSymbol } from './constants';

export function calculateGrossPnl(input: {
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  market: string;
  symbol?: string | null;
}) {
  const multiplier = input.market.toLowerCase() === 'futures'
    ? getPointValueForSymbol(input.symbol)
    : 1;

  const points = input.side === 'LONG'
    ? input.exitPrice - input.entryPrice
    : input.entryPrice - input.exitPrice;

  return Number((points * input.quantity * multiplier).toFixed(2));
}

export function calculateNetPnl(grossPnl: number, fees: number) {
  return Number((grossPnl - fees).toFixed(2));
}

export function calculateRMultiple(netPnl: number, riskAmount?: number | null) {
  if (!riskAmount || riskAmount <= 0) return null;
  return Number((netPnl / riskAmount).toFixed(2));
}

export function calculateHoldMinutes(entryTime?: string | Date | null, exitTime?: string | Date | null) {
  if (!entryTime || !exitTime) return null;
  return differenceInMinutes(new Date(exitTime), new Date(entryTime));
}
