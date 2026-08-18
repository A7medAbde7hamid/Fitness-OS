import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: Record<string, CheckResult>;
}

interface CheckResult {
  status: 'ok' | 'error' | 'skipped';
  latencyMs?: number;
  message?: string;
}

const startTime = Date.now();

export async function healthCheck(_req: Request, res: Response): Promise<void> {
  const result = await runHealthChecks();
  const httpStatus = result.status === 'unhealthy' ? 503 : 200;
  res.status(httpStatus).json(result);
}

export async function healthDb(_req: Request, res: Response): Promise<void> {
  const check = await checkDatabase();
  const httpStatus = check.status === 'ok' ? 200 : 503;
  res.status(httpStatus).json(check);
}

export async function healthAi(_req: Request, res: Response): Promise<void> {
  const check = await checkAI();
  const httpStatus = check.status === 'ok' ? 200 : 503;
  res.status(httpStatus).json(check);
}

export async function healthWhatsapp(_req: Request, res: Response): Promise<void> {
  const check = await checkWhatsApp();
  const httpStatus = check.status === 'error' ? 503 : 200;
  res.status(httpStatus).json(check);
}

async function runHealthChecks(): Promise<HealthStatus> {
  const checks: Record<string, CheckResult> = {};

  const [dbCheck, waCheck] = await Promise.allSettled([
    checkDatabase(),
    checkWhatsApp(),
  ]);

  checks.database = dbCheck.status === 'fulfilled' ? dbCheck.value : { status: 'error', message: 'Check failed' };
  checks.whatsapp = waCheck.status === 'fulfilled' ? waCheck.value : { status: 'error', message: 'Check failed' };

  const statuses = Object.values(checks).map(c => c.status);
  let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (statuses.includes('error')) overall = 'unhealthy';
  else if (statuses.includes('skipped')) overall = 'degraded';

  return {
    status: overall,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks,
  };
}

async function checkDatabase(): Promise<CheckResult> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { status: 'skipped', message: 'Supabase not configured' };

  const start = Date.now();
  try {
    const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { error } = await supabase.from('profiles').select('id').limit(1);
    const latencyMs = Date.now() - start;
    if (error) return { status: 'error', latencyMs, message: 'Database query failed' };
    return { status: 'ok', latencyMs };
  } catch {
    return { status: 'error', latencyMs: Date.now() - start, message: 'Connection failed' };
  }
}

async function checkAI(): Promise<CheckResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { status: 'skipped', message: 'Gemini API key not configured' };
  return { status: 'ok', message: 'API key configured' };
}

async function checkWhatsApp(): Promise<CheckResult> {
  const provider = process.env.WHATSAPP_PROVIDER || 'mock';
  if (provider === 'mock') return { status: 'ok', message: 'Mock provider (development)' };
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) return { status: 'skipped', message: 'WhatsApp access token not configured' };
  return { status: 'ok', message: 'Cloud API provider configured' };
}
