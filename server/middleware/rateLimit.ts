import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 60_000;

let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyFn?: (req: Request) => string;
  message?: string;
}

export function rateLimit(opts: RateLimitOptions) {
  const { windowMs, max, keyFn, message } = opts;
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip rate limiting in development/test mode (Vite dev server)
    if (process.env.NODE_ENV === 'development' && !process.env.RATE_LIMIT_ENABLED) {
      return next();
    }

    cleanup();
    const key = keyFn ? keyFn(req) : (req.ip || req.socket.remoteAddress || 'unknown');
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    const remaining = Math.max(0, max - entry.count);
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(resetSeconds));

    if (entry.count > max) {
      res.setHeader('Retry-After', String(resetSeconds));
      res.status(429).json({
        error: message || 'Too many requests. Please try again later.',
        retryAfter: resetSeconds,
      });
      return;
    }

    next();
  };
}

// Pre-configured rate limiters
export const globalLimiter = rateLimit({ windowMs: 60_000, max: 120 });
export const authLimiter = rateLimit({ windowMs: 60_000, max: 10, message: 'Too many auth attempts.' });
export const aiLimiter = rateLimit({ windowMs: 60_000, max: 30, message: 'Too many AI requests.' });
export const syncLimiter = rateLimit({ windowMs: 60_000, max: 60, message: 'Too many sync requests.' });
