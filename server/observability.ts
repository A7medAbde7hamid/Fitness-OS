import crypto from 'crypto';

export interface RequestContext {
  requestId: string;
  method: string;
  path: string;
  startTime: number;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

export function generateRequestId(): string {
  return 'req_' + Date.now().toString(36) + '_' + crypto.randomBytes(6).toString('hex');
}

export function logRequest(ctx: RequestContext, statusCode: number, durationMs: number): void {
  const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
  console.log(JSON.stringify({
    level,
    type: 'http_request',
    requestId: ctx.requestId,
    method: ctx.method,
    path: ctx.path,
    statusCode,
    durationMs,
    userId: ctx.userId ? hashId(ctx.userId) : undefined,
    ip: ctx.ip ? maskIp(ctx.ip) : undefined,
    timestamp: new Date().toISOString(),
  }));
}

export function logError(module: string, error: unknown, context?: Record<string, unknown>): void {
  console.error(JSON.stringify({
    level: 'ERROR',
    type: 'application_error',
    module,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
    timestamp: new Date().toISOString(),
  }));
}

export function logEvent(module: string, event: string, data?: Record<string, unknown>): void {
  console.log(JSON.stringify({
    level: 'INFO',
    type: 'application_event',
    module,
    event,
    ...data,
    timestamp: new Date().toISOString(),
  }));
}

export function logAiRequest(data: {
  provider: string;
  model: string;
  durationMs: number;
  success: boolean;
  feature: string;
  userId?: string;
  tokenEstimate?: number;
  error?: string;
}): void {
  console.log(JSON.stringify({
    level: data.success ? 'INFO' : 'WARN',
    type: 'ai_request',
    ...data,
    userId: data.userId ? hashId(data.userId) : undefined,
    timestamp: new Date().toISOString(),
  }));
}

function hashId(id: string): string {
  return crypto.createHash('sha256').update(id).digest('hex').slice(0, 12);
}

function maskIp(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`;
  return ip;
}
