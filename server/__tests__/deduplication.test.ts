import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Set env vars BEFORE importing the module
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_key';

const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

function buildChain() {
  const c: Record<string, unknown> = {};
  const methods = ['select', 'insert', 'eq'];
  for (const m of methods) {
    c[m] = vi.fn().mockReturnValue(c);
  }
  c.single = mockSingle;
  return c;
}

const chain = buildChain();
const mockFrom = vi.fn().mockReturnValue(chain);

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

const { WhatsAppDeduplication } = await import('../whatsapp/deduplication');

describe('WhatsAppDeduplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const m of ['select', 'insert', 'eq']) {
      (chain[m] as ReturnType<typeof vi.fn>).mockReturnValue(chain);
    }
    (chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    mockFrom.mockReturnValue(chain);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isProcessed', () => {
    it('should return false if message not found', async () => {
      const result = await WhatsAppDeduplication.isProcessed('msg_1');
      expect(result).toBe(false);
      expect(mockFrom).toHaveBeenCalledWith('whatsapp_message_log');
    });

    it('should return true if message found', async () => {
      (chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { id: 'log_1', external_message_id: 'msg_1' },
        error: null,
      });
      const result = await WhatsAppDeduplication.isProcessed('msg_1');
      expect(result).toBe(true);
    });
  });

  describe('markProcessed', () => {
    it('should insert message log entry', async () => {
      await WhatsAppDeduplication.markProcessed('msg_1', 'sender_1', 'processed');
      expect(mockFrom).toHaveBeenCalledWith('whatsapp_message_log');
      expect(chain.insert).toHaveBeenCalledWith({
        external_message_id: 'msg_1',
        sender_id: 'sender_1',
        status: 'processed',
        processed_at: expect.any(String),
      });
    });
  });

  describe('markFailed', () => {
    it('should insert failed message log entry', async () => {
      await WhatsAppDeduplication.markFailed('msg_1', 'sender_1', 'network error');
      expect(chain.insert).toHaveBeenCalledWith({
        external_message_id: 'msg_1',
        sender_id: 'sender_1',
        status: 'failed',
        error_message: 'network error',
        processed_at: expect.any(String),
      });
    });
  });
});
