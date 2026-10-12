import { prisma } from '@/lib/prisma';

export async function claimLegacyData(userId: string) {
  const [hasOwnedRecords, hasLegacyRecords] = await Promise.all([
    Promise.all([
      prisma.trade.findFirst({ where: { userId }, select: { id: true } }),
      prisma.account.findFirst({ where: { userId }, select: { id: true } }),
      prisma.playbook.findFirst({ where: { userId }, select: { id: true } }),
      prisma.tag.findFirst({ where: { userId }, select: { id: true } }),
      prisma.review.findFirst({ where: { userId }, select: { id: true } }),
      prisma.importTemplate.findFirst({ where: { userId }, select: { id: true } }),
      prisma.setting.findFirst({ where: { userId }, select: { id: true } }),
    ]).then((items) => items.some(Boolean)),
    Promise.all([
      prisma.trade.findFirst({ where: { userId: null }, select: { id: true } }),
      prisma.account.findFirst({ where: { userId: null }, select: { id: true } }),
      prisma.playbook.findFirst({ where: { userId: null }, select: { id: true } }),
      prisma.tag.findFirst({ where: { userId: null }, select: { id: true } }),
      prisma.review.findFirst({ where: { userId: null }, select: { id: true } }),
      prisma.importTemplate.findFirst({ where: { userId: null }, select: { id: true } }),
      prisma.setting.findFirst({ where: { userId: null }, select: { id: true } }),
    ]).then((items) => items.some(Boolean)),
  ]);

  if (hasOwnedRecords || !hasLegacyRecords) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.account.updateMany({ where: { userId: null }, data: { userId } });
    await tx.playbook.updateMany({ where: { userId: null }, data: { userId } });
    await tx.tag.updateMany({ where: { userId: null }, data: { userId } });
    await tx.review.updateMany({ where: { userId: null }, data: { userId } });
    await tx.importTemplate.updateMany({ where: { userId: null }, data: { userId } });
    await tx.setting.updateMany({ where: { userId: null }, data: { userId } });
    await tx.trade.updateMany({ where: { userId: null }, data: { userId } });
  });
}
