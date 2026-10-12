'use client';

import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import { Account, ImportTemplate } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const targetFields = ['tradeDate', 'symbol', 'market', 'side', 'entryPrice', 'exitPrice', 'quantity', 'fees'] as const;

export function ImportWizard({ accounts, templates }: { accounts: Account[]; templates: ImportTemplate[] }) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [templateName, setTemplateName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const preview = useMemo(() => rows.slice(0, 5), [rows]);

  function onFile(file: File | null) {
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setRows(result.data);
        setHeaders(result.meta.fields || []);
        setMessage(null);
      },
    });
  }

  async function importRows() {
    setSubmitting(true);
    setMessage(null);
    const res = await fetch('/api/import-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, mapping, accountId, templateName }),
    });
    const json = await res.json();
    if (!res.ok) setMessage(json.error || 'Import failed');
    else setMessage(`Imported ${json.imported} trades. ${json.errors?.length ? `${json.errors.length} rows skipped.` : ''}`);
    setSubmitting(false);
  }

  async function applyTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    setMapping(JSON.parse(template.mappingJson));
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import trades from CSV</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm text-muted">CSV file</label>
            <Input type="file" accept=".csv" onChange={(e) => onFile(e.target.files?.[0] || null)} />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted">Account for imported trades</label>
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted">Apply saved template</label>
            <Select defaultValue="" onChange={(e) => applyTemplate(e.target.value)}>
              <option value="">Select template</option>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      {headers.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Column mapping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {targetFields.map((field) => (
                <div key={field}>
                  <label className="mb-2 block text-sm text-muted">{field}</label>
                  <Select value={mapping[field] || ''} onChange={(e) => setMapping((current) => ({ ...current, [field]: e.target.value }))}>
                    <option value="">Not mapped</option>
                    {headers.map((header) => <option key={header} value={header}>{header}</option>)}
                  </Select>
                </div>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm text-muted">Save template as</label>
                <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="My broker format" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" className="bg-accent text-black hover:bg-accent/90" onClick={importRows} disabled={submitting}>
                {submitting ? 'Importing...' : 'Import rows'}
              </Button>
              <a href="/sample-trades.csv" className="inline-flex items-center rounded-xl border border-border px-4 py-2 text-sm text-zinc-300 hover:bg-white/5">Download sample CSV</a>
            </div>
            {message ? <div className="text-sm text-muted">{message}</div> : null}
          </CardContent>
        </Card>
      ) : null}

      {preview.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted">
                    {headers.map((header) => <th key={header} className="px-3 py-2">{header}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index} className="border-b border-border/60 text-zinc-300">
                      {headers.map((header) => <td key={header} className="px-3 py-2">{row[header]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
