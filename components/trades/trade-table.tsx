'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { TradeWithRelations } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatDate } from '@/lib/utils';

export function TradeTable({ trades }: { trades: TradeWithRelations[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'tradeDate', desc: true }]);

  const columns = useMemo<ColumnDef<TradeWithRelations>[]>(
    () => [
      {
        accessorKey: 'tradeDate',
        header: 'Date',
        cell: ({ row }) => formatDate(row.original.tradeDate),
      },
      { accessorKey: 'symbol', header: 'Symbol' },
      { accessorKey: 'side', header: 'Side' },
      {
        id: 'account',
        header: 'Account',
        cell: ({ row }) => row.original.account.name,
      },
      {
        id: 'setup',
        header: 'Setup',
        cell: ({ row }) => row.original.playbook?.name || '—',
      },
      {
        accessorKey: 'netPnl',
        header: 'Net P&L',
        cell: ({ row }) => <span className={row.original.netPnl >= 0 ? 'text-success' : 'text-danger'}>{formatCurrency(row.original.netPnl)}</span>,
      },
      {
        id: 'tags',
        header: 'Tags',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.tags.slice(0, 3).map((tag) => (
              <Badge key={tag.tagId}>{tag.tag.name}</Badge>
            ))}
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Link href={`/trades/${row.original.id}`} className="text-sm text-accent hover:underline">
            View
          </Link>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: trades,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (!trades.length) {
    return (
      <EmptyState
        title="No trades match these filters"
        description="Try widening the date range, clearing a tag filter, or log a new trade."
        tips={['Review works best when every trade has a setup tag.', 'Link screenshots to your most important trades.', 'Use playbooks to separate your A setups from everything else.']}
        action={<Link href="/trades/new"><Button className="bg-accent text-black hover:bg-accent/90">Log new trade</Button></Link>}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:hidden">
        {table.getRowModel().rows.map((row) => (
          <Link key={row.id} href={`/trades/${row.original.id}`} className="rounded-2xl border border-border bg-panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-muted">{formatDate(row.original.tradeDate)}</div>
                <div className="mt-1 text-lg font-semibold text-white">{row.original.symbol} {row.original.side}</div>
              </div>
              <div className={`text-sm font-medium ${row.original.netPnl >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(row.original.netPnl)}</div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-xs text-muted">Account</div><div className="text-zinc-200">{row.original.account.name}</div></div>
              <div><div className="text-xs text-muted">Setup</div><div className="text-zinc-200">{row.original.playbook?.name || '—'}</div></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {row.original.tags.slice(0, 3).map((tag) => <Badge key={tag.tagId}>{tag.tag.name}</Badge>)}
            </div>
          </Link>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-border bg-panel md:block">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-soft/70 text-left text-xs uppercase tracking-wide text-muted">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-medium">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-white/[0.03]">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-top text-zinc-300">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button type="button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
