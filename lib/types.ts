import { Prisma } from '@prisma/client';

export type TradeWithRelations = Prisma.TradeGetPayload<{
  include: {
    account: true;
    playbook: true;
    images: true;
    tags: { include: { tag: true } };
  };
}>;

export type PlaybookWithTrades = Prisma.PlaybookGetPayload<{
  include: {
    trades: {
      include: {
        account: true;
        images: true;
        tags: { include: { tag: true } };
      };
    };
  };
}>;
