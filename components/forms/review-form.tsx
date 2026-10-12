'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { reviewSchema } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const schema = reviewSchema;
type FormValues = z.infer<typeof schema>;

export function ReviewForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      periodType: 'DAILY',
      reviewDate: new Date().toISOString().slice(0, 10),
      title: '',
      summary: '',
      topLessons: '',
      biggestMistakes: '',
      repeatedPatterns: '',
      improvementGoals: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const json = await res.json();
    if (!res.ok) alert(json.error || 'Failed to save review');
    else {
      form.reset({ ...form.getValues(), title: '', summary: '', topLessons: '', biggestMistakes: '', repeatedPatterns: '', improvementGoals: '' });
      router.refresh();
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 rounded-2xl border border-border bg-panel p-5 md:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm text-muted">Period type</label>
        <Select {...form.register('periodType')}>
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
        </Select>
      </div>
      <div>
        <label className="mb-2 block text-sm text-muted">Review date</label>
        <Input type="date" {...form.register('reviewDate')} />
      </div>
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm text-muted">Title</label>
        <Input {...form.register('title')} />
      </div>
      <Field label="Summary"><Textarea {...form.register('summary')} /></Field>
      <Field label="Top lessons"><Textarea {...form.register('topLessons')} /></Field>
      <Field label="Biggest mistakes"><Textarea {...form.register('biggestMistakes')} /></Field>
      <Field label="Repeated patterns"><Textarea {...form.register('repeatedPatterns')} /></Field>
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm text-muted">Improvement goals</label>
        <Textarea {...form.register('improvementGoals')} />
      </div>
      <div className="md:col-span-2">
        <Button className="bg-accent text-black hover:bg-accent/90" disabled={submitting}>{submitting ? 'Saving...' : 'Save review'}</Button>
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
