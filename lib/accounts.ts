import { prisma } from '@/lib/prisma';

export const preferredAccounts = [
  { name: 'Topstep', broker: 'Tradovate', initialSize: 50000 },
  { name: 'LucidTrading', broker: 'Tradovate', initialSize: 50000 },
  { name: 'Alpha Futures', broker: 'Tradovate', initialSize: 50000 },
] as const;

const legacyRenameMap: Record<string, string> = {
  'Main Futures': 'Topstep',
  'Swing Equities': 'LucidTrading',
};

export async function ensurePreferredAccounts(userId: string) {
  for (const [legacyName, preferredName] of Object.entries(legacyRenameMap)) {
    const legacy = await prisma.account.findFirst({ where: { userId, name: legacyName } });
    if (!legacy) continue;

    const existingPreferred = await prisma.account.findFirst({ where: { userId, name: preferredName } });
    if (existingPreferred) {
      await prisma.trade.updateMany({
        where: { userId, accountId: legacy.id },
        data: { accountId: existingPreferred.id },
      });
      await prisma.account.delete({ where: { id: legacy.id } });
    } else {
      await prisma.account.update({
        where: { id: legacy.id },
        data: {
          name: preferredName,
          broker: 'Tradovate',
          initialSize: legacy.initialSize || 50000,
        },
      });
    }
  }

  for (const account of preferredAccounts) {
    const existing = await prisma.account.findFirst({ where: { userId, name: account.name } });
    if (!existing) {
      await prisma.account.create({ data: { userId, ...account } });
    }
  }

  return prisma.account.findMany({
    where: { userId, name: { in: preferredAccounts.map((account) => account.name) } },
    orderBy: { name: 'asc' },
  });
}
