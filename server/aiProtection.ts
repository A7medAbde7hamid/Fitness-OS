import { logAiRequest } from './observability';

interface AiRequestMeta {
  userId: string;
  feature: string;
  provider: string;
  model: string;
  startTime: number;
  language: 'en' | 'ar';
}

const MAX_TOOL_ITERATIONS = 5;
const REQUEST_TIMEOUT_MS = 30_000;

export function getMaxToolIterations(): number {
  return MAX_TOOL_ITERATIONS;
}

export function getRequestTimeoutMs(): number {
  return REQUEST_TIMEOUT_MS;
}

export function createAiMeta(userId: string, feature: string, language: 'en' | 'ar'): AiRequestMeta {
  return {
    userId,
    feature,
    provider: 'google',
    model: 'gemini-3.7-flash',
    startTime: Date.now(),
    language,
  };
}

export function trackAiSuccess(meta: AiRequestMeta, tokenEstimate?: number): void {
  logAiRequest({
    provider: meta.provider,
    model: meta.model,
    durationMs: Date.now() - meta.startTime,
    success: true,
    feature: meta.feature,
    userId: meta.userId,
    tokenEstimate,
  });
}

export function trackAiFailure(meta: AiRequestMeta, error: string): void {
  logAiRequest({
    provider: meta.provider,
    model: meta.model,
    durationMs: Date.now() - meta.startTime,
    success: false,
    feature: meta.feature,
    userId: meta.userId,
    error,
  });
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function sanitizeUserInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .slice(0, 4000);
}
