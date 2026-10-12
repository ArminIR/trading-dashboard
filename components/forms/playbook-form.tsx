'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { playbookSchema } from '@/lib/validation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Playbook } from '@prisma/client';
import { safeJsonParse } from '@/lib/utils';

const schema = playbookSchema;
type FormValues = z.infer<typeof schema>;

export function PlaybookForm({ playbook }: { playbook?: Playbook | null }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: playbook?.name || '',
      description: playbook?.description || '',
      marketConditions: playbook?.marketConditions || '',
      entryCriteria: playbook?.entryCriteria || '',
      exitCriteria: playbook?.exitCriteria || '',
      invalidationRules: playbook?.invalidationRules || '',
      checklist: playbook?.checklist || '',
      exampleImageUrls: safeJsonParse<string[]>(playbook?.exampleImagesJson, []),
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const res = await fetch('/api/playbooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const json = await res.json();
    if (!res.ok) alert(json.error || 'Failed to save playbook');
    else {
      form.reset();
      router.refresh();
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 rounded-2xl border border-border bg-panel p-5 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm text-muted">Name</label>
        <Input {...form.register('name')} />
      </div>
      <Field label="Description"><Textarea {...form.register('description')} /></Field>
      <Field label="Market conditions"><Textarea {...form.register('marketConditions')} /></Field>
      <Field label="Entry criteria"><Textarea {...form.register('entryCriteria')} /></Field>
      <Field label="Exit criteria"><Textarea {...form.register('exitCriteria')} /></Field>
      <Field label="Invalidation rules"><Textarea {...form.register('invalidationRules')} /></Field>
      <Field label="Checklist (one per line)"><Textarea {...form.register('checklist')} /></Field>
      <div className="md:col-span-2">
        <Button className="bg-accent text-black hover:bg-accent/90" disabled={submitting}>{submitting ? 'Saving...' : 'Save playbook'}</Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-muted">{label}</label>
      {children}
    </div>
  );
}
