import Link from 'next/link';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';

const weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type CalendarDay = {
  date: string;
  label: string;
  pnl: number;
  trades: number;
  winRate: number;
};

export function MonthlyPnlCalendar({ month, days }: { month?: string; days: CalendarDay[] }) {
  const visibleMonth = month ? parse(`${month}-01`, 'yyyy-MM-dd', new Date()) : new Date();
  const monthStart = startOfMonth(visibleMonth);
  const monthEnd = endOfMonth(visibleMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const calendarMap = new Map(days.map((day) => [day.date, day]));
  const monthKey = format(visibleMonth, 'yyyy-MM');
  const prevMonth = format(addMonths(visibleMonth, -1), 'yyyy-MM');
  const nextMonth = format(addMonths(visibleMonth, 1), 'yyyy-MM');
  const todayMonth = format(new Date(), 'yyyy-MM');

  const monthlyDays = days.filter((day) => day.date.startsWith(monthKey));
  const monthlyPnl = monthlyDays.reduce((sum, day) => sum + day.pnl, 0);
  const monthlyTrades = monthlyDays.reduce((sum, day) => sum + day.trades, 0);
  const greenDays = monthlyDays.filter((day) => day.pnl > 0).length;
  const redDays = monthlyDays.filter((day) => day.pnl < 0).length;

  const weekChunks = Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, index) =>
    calendarDays.slice(index * 7, index * 7 + 7),
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/reports?month=${prevMonth}`} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-soft text-zinc-200 transition hover:bg-white/10">
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div>
              <CardTitle className="text-base sm:text-lg">Monthly P&amp;L Calendar</CardTitle>
              <div className="mt-1 text-sm text-zinc-400">{format(visibleMonth, 'MMMM yyyy')}</div>
            </div>
            <Link href={`/reports?month=${nextMonth}`} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-soft text-zinc-200 transition hover:bg-white/10">
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-border bg-soft/60 px-4 py-2">
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted">Monthly P&amp;L</div>
              <div className={cn('mt-1 text-lg font-semibold', monthlyPnl >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
                {formatCurrency(monthlyPnl)}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-soft/60 px-4 py-2 text-sm text-zinc-300">
              <span className="font-medium text-white">{monthlyTrades}</span> trades · <span className="font-medium text-emerald-300">{greenDays}</span> green days · <span className="font-medium text-rose-300">{redDays}</span> red days
            </div>
            <Link href={`/reports?month=${todayMonth}`} className="inline-flex items-center justify-center rounded-xl border border-border bg-soft px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10">Today</Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="hidden grid-cols-8 border-b border-border text-xs uppercase tracking-[0.18em] text-muted md:grid">
          {weekLabels.map((label) => (
            <div key={label} className="border-r border-border px-4 py-3 text-center last:border-r-0">{label}</div>
          ))}
          <div className="px-4 py-3 text-center">Week</div>
        </div>

        <div className="hidden md:block">
          {weekChunks.map((week, weekIndex) => {
            const weekRows = week.map((date) => {
              const key = format(date, 'yyyy-MM-dd');
              return { date, data: calendarMap.get(key) };
            });
            const weekPnl = weekRows.reduce((sum, item) => sum + (item.data?.pnl || 0), 0);
            const weekTrades = weekRows.reduce((sum, item) => sum + (item.data?.trades || 0), 0);

            return (
              <div key={weekIndex} className="grid grid-cols-8 border-b border-border last:border-b-0">
                {weekRows.map(({ date, data }) => {
                  const inMonth = isSameMonth(date, visibleMonth);
                  const hasTrades = Boolean(data?.trades);
                  return (
                    <div
                      key={format(date, 'yyyy-MM-dd')}
                      className={cn(
                        'min-h-[138px] border-r border-border px-3 py-3 last:border-r-0',
                        inMonth ? 'bg-black/15' : 'bg-white/[0.02] text-zinc-600',
                        hasTrades && (data!.pnl >= 0 ? 'bg-emerald-950/55' : 'bg-rose-950/45'),
                        isToday(date) && 'ring-1 ring-inset ring-accent',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className={cn('text-sm', inMonth ? 'text-zinc-300' : 'text-zinc-600')}>{format(date, 'd')}</div>
                        {isToday(date) && <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-accent">Today</span>}
                      </div>

                      {hasTrades ? (
                        <div className="mt-6 space-y-1">
                          <div className={cn('text-2xl font-semibold tracking-tight', data!.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
                            {formatCurrency(data!.pnl)}
                          </div>
                          <div className="text-sm text-zinc-300">{data!.trades} trade{data!.trades === 1 ? '' : 's'}</div>
                          <div className="text-xs text-zinc-400">Win rate {data!.winRate.toFixed(0)}%</div>
                        </div>
                      ) : (
                        <div className="mt-10 text-xs text-zinc-600">No trades</div>
                      )}
                    </div>
                  );
                })}

                <div className="flex min-h-[138px] flex-col justify-between bg-soft/40 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted">Week {weekIndex + 1}</div>
                  <div>
                    <div className={cn('text-2xl font-semibold', weekPnl >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
                      {formatCurrency(weekPnl)}
                    </div>
                    <div className="mt-1 text-sm text-zinc-400">{weekTrades} trade{weekTrades === 1 ? '' : 's'}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-3 p-4 md:hidden">
          {calendarDays.map((date) => {
            const key = format(date, 'yyyy-MM-dd');
            const data = calendarMap.get(key);
            const inMonth = isSameMonth(date, visibleMonth);
            return (
              <div
                key={key}
                className={cn(
                  'rounded-2xl border border-border px-4 py-4',
                  inMonth ? 'bg-panel' : 'bg-white/[0.02] text-zinc-600',
                  data && (data.pnl >= 0 ? 'border-emerald-800/70 bg-emerald-950/30' : 'border-rose-900/70 bg-rose-950/20'),
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-zinc-300">{format(date, 'EEE, MMM d')}</div>
                  {isToday(date) && <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-accent">Today</span>}
                </div>

                {data ? (
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <div className={cn('text-xl font-semibold', data.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300')}>{formatCurrency(data.pnl)}</div>
                      <div className="text-sm text-zinc-400">{data.trades} trade{data.trades === 1 ? '' : 's'} · Win rate {data.winRate.toFixed(0)}%</div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-zinc-500">No trades logged.</div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
