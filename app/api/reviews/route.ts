import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reviewSchema } from '@/lib/validation';
import { requireApiUser } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const values = parsed.data;
  const review = await prisma.review.create({
    data: {
      userId: user.id,
      periodType: values.periodType,
      reviewDate: new Date(values.reviewDate),
      title: values.title,
      summary: values.summary || null,
      topLessons: values.topLessons || null,
      biggestMistakes: values.biggestMistakes || null,
      repeatedPatterns: values.repeatedPatterns || null,
      improvementGoals: values.improvementGoals || null,
    },
  });

  return NextResponse.json({ review });
}
