'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BookOpen, Download, LayoutDashboard, Settings, Target, CalendarRange, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';

const items = [
  { href: '/dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { href: '/trades', label: 'Trades', shortLabel: 'Trades', icon: BookOpen },
  { href: '/imports', label: 'Imports', shortLabel: 'Import', icon: Download },
  { href: '/reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3 },
  { href: '/playbooks', label: 'Playbooks', shortLabel: 'Playbooks', icon: Target },
  { href: '/reviews', label: 'Reviews', shortLabel: 'Review', icon: CalendarRange },
  { href: '/settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="glass-panel sticky top-0 hidden h-screen w-72 flex-col border-r border-border px-4 py-6 lg:flex">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-accent">Private trading journal</div>
          <div className="mt-2 text-xl font-semibold text-white">{APP_NAME}</div>
          <p className="mt-3 text-sm text-zinc-400">Private, account-based, built for deliberate review and execution quality.</p>
        </div>

        <nav className="mt-6 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white',
                  active && 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-border bg-white/[0.03] p-4 text-sm text-zinc-400">
          <div className="font-medium text-white">Review cadence</div>
          <p className="mt-2">Log the trade fast. Review the behavior slower. Promote only setups that earn it.</p>
        </div>

        <form action="/api/logout" method="post" className="mt-4 px-2">
          <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
      </aside>

      <nav className="glass-panel fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-border px-2 py-2 lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {items.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] text-zinc-400 transition',
                  active && 'bg-white/10 text-white',
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
