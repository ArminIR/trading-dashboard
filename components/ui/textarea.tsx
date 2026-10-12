import { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn('min-h-[110px] w-full rounded-xl border border-border bg-soft px-3 py-2 text-sm text-white outline-none placeholder:text-muted focus:border-accent', className)} {...props} />
  );
}
