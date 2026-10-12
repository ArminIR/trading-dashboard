import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { ensurePreferredAccounts } from './accounts';
import { TradeWithRelations } from './types';
import { requireAuth } from './auth';

export async function getDashboardFilters() {
  const user = await requireAuth();
  const [accounts, playbooks, tags] = await Promise.all([
    ensurePreferredAccounts(user.id),
    prisma.playbook.findMany({ where: { userId: user.id }, orderBy: { name: 'asc' } }),
    prisma.tag.findMany({ where: { userId: user.id }, orderBy: { type: 'asc' } }),
  ]);

  return { accounts, playbooks, tags };
}

export async function getTradeFiltersFromSearchParams(searchParams?: Record<string, string | string[] | undefined>) {
  const user = await requireAuth();
  const qp = searchParams || {};
  const where: Prisma.TradeWhereInput = { userId: user.id };

  if (typeof qp.accountId === 'string' && qp.accountId) where.accountId = qp.accountId;
  if (typeof qp.side === 'string' && qp.side) where.side = qp.side as any;
  if (typeof qp.symbol === 'string' && qp.symbol) where.symbol = { contains: qp.symbol };
  if (typeof qp.setup === 'string' && qp.setup) where.playbookId = qp.setup;

  const startDate = typeof qp.startDate === 'string' && qp.startDate ? new Date(qp.startDate) : null;
  const endDate = typeof qp.endDate === 'string' && qp.endDate ? new Date(qp.endDate) : null;
  if (startDate || endDate) {
    where.tradeDate = {};
    if (startDate) where.tradeDate.gte = startDate;
    if (endDate) where.tradeDate.lte = endDate;
  }

  if (typeof qp.tagId === 'string' && qp.tagId) {
    where.tags = { some: { tagId: qp.tagId, tag: { userId: user.id } } };
  }

  return where;
}

export async function getTrades(where: Prisma.TradeWhereInput = {}) {
  const user = await requireAuth();
  return prisma.trade.findMany({
    where: { userId: user.id, ...where },
    orderBy: { tradeDate: 'desc' },
    include: {
      account: true,
      playbook: true,
      images: true,
      tags: { include: { tag: true } },
    },
  }) as Promise<TradeWithRelations[]>;
}

export async function getTradeById(id: string) {
  const user = await requireAuth();
  return prisma.trade.findFirst({
    where: { id, userId: user.id },
    include: {
      account: true,
      playbook: true,
      images: true,
      tags: { include: { tag: true } },
    },
  }) as Promise<TradeWithRelations | null>;
}

export async function getSettingsMap() {
  const user = await requireAuth();
  const settings = await prisma.setting.findMany({ where: { userId: user.id } });
  return Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
}
