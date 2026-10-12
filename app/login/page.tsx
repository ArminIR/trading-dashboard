import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { requireGuest } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default async function LoginPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  await requireGuest();
  const params = (await searchParams) || {};
  const error = typeof params.error === 'string' ? params.error : '';

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-xs uppercase tracking-[0.3em] text-accent">Secure journal access</div>
          <CardTitle className="mt-2 text-2xl">Welcome back to {APP_NAME}</CardTitle>
          <p className="mt-2 text-sm text-muted">Log in to your private trading journal dashboard.</p>
        </CardHeader>
        <CardContent>
          <form action="/api/login" method="post" className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-muted">Email</label>
              <Input type="email" name="email" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted">Password</label>
              <Input type="password" name="password" placeholder="Enter your password" required />
            </div>
            {error ? <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div> : null}
            <Button className="w-full bg-accent text-black hover:bg-accent/90">Log in</Button>
          </form>
          <p className="mt-4 text-sm text-muted">
            Need an account?{' '}
            <Link href="/register" className="text-accent hover:underline">Create one</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
