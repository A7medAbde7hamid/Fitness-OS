import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }
  return supabaseAdmin;
}

interface SyncResult {
  success: boolean;
  conflict?: boolean;
  serverVersion?: Record<string, unknown>;
  error?: string;
}

export class SyncService {
  static async upsertMeasurement(userId: string, data: {
    id: string; weightKg: number; measuredAt: string; notes?: string;
  }, idempotencyKey: string): Promise<SyncResult> {
    const db = getSupabaseAdmin();
    try {
      const { data: existing } = await db
        .from('measurements')
        .select('id, weight_kg, measured_at')
        .eq('user_id', userId)
        .eq('id', data.id)
        .single();

      if (existing) {
        return {
          success: true,
          conflict: true,
          serverVersion: { weightKg: existing.weight_kg, measuredAt: existing.measured_at },
        };
      }

      const { error } = await db.from('measurements').upsert({
        id: data.id,
        user_id: userId,
        weight_kg: data.weightKg,
        measured_at: data.measuredAt,
        notes: data.notes || null,
        idempotency_key: idempotencyKey,
      }, { onConflict: 'id' });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  static async upsertActivity(userId: string, data: {
    id: string; activityType: string; durationMinutes: number;
    caloriesBurned: number; steps?: number; distanceKm?: number; loggedAt: string;
  }, idempotencyKey: string): Promise<SyncResult> {
    const db = getSupabaseAdmin();
    try {
      const { data: existing } = await db
        .from('activities')
        .select('id')
        .eq('user_id', userId)
        .eq('id', data.id)
        .single();

      if (existing) {
        return { success: true, conflict: true, serverVersion: {} };
      }

      const { error } = await db.from('activities').upsert({
        id: data.id,
        user_id: userId,
        activity_type: data.activityType,
        duration_minutes: data.durationMinutes,
        calories_burned: data.caloriesBurned,
        steps: data.steps || null,
        distance_km: data.distanceKm || null,
        logged_at: data.loggedAt,
        source: 'sync',
        idempotency_key: idempotencyKey,
      }, { onConflict: 'id' });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  static async upsertMeal(userId: string, data: {
    id: string; name: string; mealType: string; calories: number;
    proteinG: number; carbsG: number; fatG: number; loggedAt: string;
  }, idempotencyKey: string): Promise<SyncResult> {
    const db = getSupabaseAdmin();
    try {
      const { data: existing } = await db
        .from('meals')
        .select('id')
        .eq('user_id', userId)
        .eq('id', data.id)
        .single();

      if (existing) {
        return { success: true, conflict: true, serverVersion: {} };
      }

      const { error } = await db.from('meals').upsert({
        id: data.id,
        user_id: userId,
        name: data.name,
        meal_type: data.mealType,
        calories: data.calories,
        protein_g: data.proteinG,
        carbs_g: data.carbsG,
        fat_g: data.fatG,
        logged_at: data.loggedAt,
        idempotency_key: idempotencyKey,
      }, { onConflict: 'id' });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  static async upsertWorkout(userId: string, data: {
    id: string; title: string; category: string; durationMinutes: number;
    completed: boolean; exercises?: Array<{ name: string; sets: number; reps: number; weightKg?: number }>;
    loggedAt: string;
  }, idempotencyKey: string): Promise<SyncResult> {
    const db = getSupabaseAdmin();
    try {
      const { data: existing } = await db
        .from('workouts')
        .select('id')
        .eq('user_id', userId)
        .eq('id', data.id)
        .single();

      if (existing) {
        return { success: true, conflict: true, serverVersion: {} };
      }

      const { error: workoutError } = await db.from('workouts').upsert({
        id: data.id,
        user_id: userId,
        title: data.title,
        category: data.category,
        duration_minutes: data.durationMinutes,
        completed: data.completed,
        logged_at: data.loggedAt,
        idempotency_key: idempotencyKey,
      }, { onConflict: 'id' });

      if (workoutError) throw workoutError;

      if (data.exercises && data.exercises.length > 0) {
        const exercises = data.exercises.map((ex, idx) => ({
          workout_id: data.id,
          user_id: userId,
          exercise_name: ex.name,
          order_index: idx,
          sets: ex.sets,
          reps: ex.reps,
          weight_kg: ex.weightKg || null,
        }));

        const { error: exError } = await db.from('workout_exercises').upsert(exercises, {
          onConflict: 'workout_id,order_index',
        });

        if (exError) throw exError;
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  static async processBatch(userId: string, operations: Array<{
    type: string; payload: Record<string, unknown>; idempotencyKey: string; operationId: string;
  }>): Promise<Array<{ operationId: string; success: boolean; conflict?: boolean; error?: string }>> {
    const results: Array<{ operationId: string; success: boolean; conflict?: boolean; error?: string }> = [];

    for (const op of operations) {
      let result: SyncResult;

      switch (op.type) {
        case 'log_weight':
          result = await this.upsertMeasurement(userId, op.payload as any, op.idempotencyKey);
          break;
        case 'log_activity':
          result = await this.upsertActivity(userId, op.payload as any, op.idempotencyKey);
          break;
        case 'log_meal':
          result = await this.upsertMeal(userId, op.payload as any, op.idempotencyKey);
          break;
        case 'log_workout':
          result = await this.upsertWorkout(userId, op.payload as any, op.idempotencyKey);
          break;
        default:
          result = { success: false, error: `Unknown operation type: ${op.type}` };
      }

      results.push({
        operationId: op.operationId,
        success: result.success,
        conflict: result.conflict,
        error: result.error,
      });
    }

    return results;
  }
}
