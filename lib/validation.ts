import { z } from 'zod';

export const tradePayloadSchema = z.object({
  tradeDate: z.string().min(1),
  entryTime: z.string().optional().nullable(),
  exitTime: z.string().optional().nullable(),
  symbol: z.string().min(1),
  market: z.string().min(1),
  accountId: z.string().min(1),
  side: z.enum(['LONG', 'SHORT']),
  quantity: z.coerce.number().positive(),
  entryPrice: z.coerce.number().positive(),
  exitPrice: z.coerce.number().positive(),
  fees: z.coerce.number().min(0).default(0),
  riskAmount: z.coerce.number().min(0).optional().nullable(),
  confidenceRating: z.coerce.number().min(1).max(10).optional().nullable(),
  entryReason: z.string().optional().nullable(),
  exitReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  preTradeNotes: z.string().optional().nullable(),
  postTradeNotes: z.string().optional().nullable(),
  lessonsLearned: z.string().optional().nullable(),
  executionQuality: z.string().optional().nullable(),
  followedPlan: z.coerce.boolean().default(false),
  rating: z.enum(['A+', 'A', 'B', 'C', 'F']).optional().nullable(),
  playbookId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).default([]),
  imageUrls: z.array(z.string()).default([]),
});

export const playbookSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  marketConditions: z.string().optional().nullable(),
  entryCriteria: z.string().optional().nullable(),
  exitCriteria: z.string().optional().nullable(),
  invalidationRules: z.string().optional().nullable(),
  checklist: z.string().optional().nullable(),
  exampleImageUrls: z.array(z.string()).default([]),
});

export const reviewSchema = z.object({
  periodType: z.enum(['DAILY', 'WEEKLY']),
  reviewDate: z.string().min(1),
  title: z.string().min(2),
  summary: z.string().optional().nullable(),
  topLessons: z.string().optional().nullable(),
  biggestMistakes: z.string().optional().nullable(),
  repeatedPatterns: z.string().optional().nullable(),
  improvementGoals: z.string().optional().nullable(),
});

export const accountSchema = z.object({
  name: z.string().min(2),
  broker: z.string().optional().nullable(),
  initialSize: z.coerce.number().optional().nullable(),
});

export const tagSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['SETUP', 'MISTAKE', 'EMOTION', 'EXECUTION', 'GENERAL']),
  color: z.string().optional().nullable(),
});

export const importTemplateSchema = z.object({
  name: z.string().min(2),
  mapping: z.record(z.string()),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(50).optional().or(z.literal('')),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1),
});
