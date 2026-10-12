import { ReactNode } from 'react';
import { Sidebar } from './sidebar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="mx-auto flex max-w-[1600px]">
        <Sidebar />
        <main className="min-h-screen flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}
