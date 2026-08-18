import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Set env vars BEFORE importing the module
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_key';

const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

// Build chainable mock - each fn returns chain AND records calls
function buildChain() {
  const c: Record<string, unknown> = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'upsert'];
  for (const m of methods) {
    c[m] = vi.fn().mockReturnValue(c);
  }
  c.single = mockSingle;
  c.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  return c;
}

const chain = buildChain();
const mockFrom = vi.fn().mockReturnValue(chain);

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

// Import AFTER mocking
const { WhatsAppLinkingService } = await import('../whatsapp/linking');

describe('WhatsAppLinkingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Rebuild chain methods after clearAllMocks
    const c: Record<string, unknown> = chain;
    for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'in', 'upsert']) {
      (c[m] as ReturnType<typeof vi.fn>).mockReturnValue(c);
    }
    (chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    (chain.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getConnectionByExternalId', () => {
    it('should return null when no connection found', async () => {
      const result = await WhatsAppLinkingService.getConnectionByExternalId('1234567890');
      expect(result).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('whatsapp_connections');
    });

    it('should return mapped connection when found', async () => {
      (chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          id: 'conn_1', profile_id: 'profile_1', provider: 'cloud_api',
          external_user_id: '1234567890', phone_reference: null, status: 'verified',
          language: 'en', verified_at: '2026-01-01T00:00:00Z', last_message_at: null,
          created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      });
      const result = await WhatsAppLinkingService.getConnectionByExternalId('1234567890');
      expect(result).toBeTruthy();
      expect(result?.id).toBe('conn_1');
      expect(result?.profileId).toBe('profile_1');
      expect(result?.externalUserId).toBe('1234567890');
    });
  });

  describe('disconnect', () => {
    it('should update status to disconnected', async () => {
      const result = await WhatsAppLinkingService.disconnect('profile_1');
      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('whatsapp_connections');
      expect(chain.update).toHaveBeenCalledWith({ status: 'disconnected', updated_at: expect.any(String) });
    });
  });

  describe('updateLastMessage', () => {
    it('should update last_message_at', async () => {
      await WhatsAppLinkingService.updateLastMessage('1234567890');
      expect(chain.update).toHaveBeenCalledWith({
        last_message_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });
  });

  describe('updateLanguage', () => {
    it('should update language', async () => {
      await WhatsAppLinkingService.updateLanguage('1234567890', 'ar');
      expect(chain.update).toHaveBeenCalledWith({
        language: 'ar',
        updated_at: expect.any(String),
      });
    });
  });

  describe('generateLinkingToken', () => {
    it('should generate a unique token', () => {
      const t1 = WhatsAppLinkingService.generateLinkingToken('p1');
      const t2 = WhatsAppLinkingService.generateLinkingToken('p2');
      expect(t1).toBeTruthy();
      expect(t2).toBeTruthy();
      expect(t1).not.toBe(t2);
    });
  });

  describe('verifyLinkingToken', () => {
    it('should verify a valid token', () => {
      const token = WhatsAppLinkingService.generateLinkingToken('p1');
      const result = WhatsAppLinkingService.verifyLinkingToken(token);
      expect(result).toBeTruthy();
      expect(result?.profileId).toBe('p1');
      expect(result?.used).toBe(true);
    });

    it('should reject an invalid token', () => {
      expect(WhatsAppLinkingService.verifyLinkingToken('bad')).toBeNull();
    });

    it('should reject a used token', () => {
      const token = WhatsAppLinkingService.generateLinkingToken('p1');
      WhatsAppLinkingService.verifyLinkingToken(token);
      expect(WhatsAppLinkingService.verifyLinkingToken(token)).toBeNull();
    });
  });

  describe('hashPhone', () => {
    it('should hash phone number consistently', () => {
      expect(WhatsAppLinkingService.hashPhone('+1234567890')).toBe(WhatsAppLinkingService.hashPhone('+1234567890'));
      expect(WhatsAppLinkingService.hashPhone('+1234567890').length).toBe(16);
    });
  });
});
