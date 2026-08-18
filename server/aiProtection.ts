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
  // Arabic/CJK characters use ~1-2 tokens each; Latin uses ~1 token per 4 chars.
  const nonLatinChars = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u4E00-\u9FFF\u3400-\u4DBF]/g) || []).length;
  const latinChars = text.length - nonLatinChars;
  return Math.ceil(nonLatinChars * 1.5 + latinChars / 4);
}

export function sanitizeUserInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .slice(0, 4000);
}
