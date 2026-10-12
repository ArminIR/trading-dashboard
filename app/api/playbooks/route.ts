import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { playbookSchema } from '@/lib/validation';
import { requireApiUser } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = playbookSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const values = parsed.data;
  try {
    const playbook = await prisma.playbook.create({
    data: {
      userId: user.id,
      name: values.name,
      description: values.description || null,
      marketConditions: values.marketConditions || null,
      entryCriteria: values.entryCriteria || null,
      exitCriteria: values.exitCriteria || null,
      invalidationRules: values.invalidationRules || null,
      checklist: values.checklist || null,
      exampleImagesJson: JSON.stringify(values.exampleImageUrls || []),
    },
  });

    return NextResponse.json({ playbook });
  } catch {
    return NextResponse.json({ error: 'A playbook with that name already exists.' }, { status: 400 });
  }
}
