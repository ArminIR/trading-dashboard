import { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('w-full rounded-xl border border-border bg-soft px-3 py-2 text-sm text-white outline-none focus:border-accent', className)} {...props} />
  );
}
