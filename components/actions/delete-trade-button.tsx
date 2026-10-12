'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function DeleteTradeButton({ tradeId }: { tradeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm('Delete this trade? This cannot be undone.');
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/trades/${tradeId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete trade');
      router.push('/trades');
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete trade');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" onClick={handleDelete} disabled={loading} className="border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20">
      {loading ? 'Deleting...' : 'Delete trade'}
    </Button>
  );
}
