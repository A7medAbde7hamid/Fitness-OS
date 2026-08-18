import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map(i => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      res.status(400).json({
        error: 'Validation failed.',
        details: errors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

// ── Sync Schemas ──

export const syncLogWeightSchema = z.object({
  id: z.string().min(1),
  weightKg: z.number().min(20).max(300),
  measuredAt: z.string(),
  notes: z.string().max(500).optional(),
  idempotencyKey: z.string().min(1),
});

export const syncLogActivitySchema = z.object({
  id: z.string().min(1),
  activityType: z.enum(['steps', 'walking', 'running', 'cycling', 'swimming', 'hiit', 'other']),
  durationMinutes: z.number().min(1).max(1440),
  caloriesBurned: z.number().min(0).max(10000),
  steps: z.number().min(0).max(100000).optional(),
  distanceKm: z.number().min(0).max(500).optional(),
  loggedAt: z.string(),
  idempotencyKey: z.string().min(1),
});

export const syncLogMealSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  calories: z.number().min(0).max(10000),
  proteinG: z.number().min(0).max(1000),
  carbsG: z.number().min(0).max(1000),
  fatG: z.number().min(0).max(1000),
  loggedAt: z.string(),
  idempotencyKey: z.string().min(1),
});

export const syncLogWorkoutSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  category: z.string().max(100),
  durationMinutes: z.number().min(1).max(180),
  completed: z.boolean(),
  exercises: z.array(z.object({
    name: z.string().max(200),
    sets: z.number().min(0).max(100),
    reps: z.number().min(0).max(1000),
    weightKg: z.number().min(0).max(500).optional(),
  })).optional(),
  loggedAt: z.string(),
  idempotencyKey: z.string().min(1),
});

export const syncBatchSchema = z.object({
  operations: z.array(z.object({
    type: z.enum(['log_weight', 'log_activity', 'log_meal', 'log_workout']),
    payload: z.record(z.string(), z.unknown()),
    idempotencyKey: z.string().min(1),
    operationId: z.string().min(1),
  })).min(1).max(50),
});
