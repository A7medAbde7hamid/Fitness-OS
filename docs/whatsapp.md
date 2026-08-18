# WhatsApp AI Coach Integration

Phase 7 adds WhatsApp as an additional communication channel for the AI Fitness Coach. Users can log meals, check progress, and chat with the AI coach via WhatsApp messages.

## Architecture

```
WhatsApp Cloud API → Webhook (POST /api/whatsapp/webhook)
    → normalizeWebhookPayload()
    → WhatsAppDeduplication.isProcessed()
    → WhatsAppLinkingService.getConnectionByExternalId()
    → routeMessage()
        → extractTextIntent() → command routing
        → AI Coach (Gemini) → tool execution → reply
    → WhatsAppProvider.sendText()
```

### Provider Abstraction

- **`CloudAPIProvider`**: Production provider using Meta's WhatsApp Business Cloud API
- **`MockProvider`**: Development/testing provider with in-memory message store
- Factory: `getWhatsAppProvider()` returns the appropriate provider based on `WHATSAPP_PROVIDER` env var

### Message Flow

1. **Webhook receives message** → `handleWebhookPost()` acknowledges immediately (200), processes async
2. **Normalization** → Raw payload → `WhatsAppNormalizedMessage` with type, text, media, metadata
3. **Deduplication** → Skip if `whatsapp_message_log` already has this message ID
4. **Linking check** → Resolve phone number to `profileId` via `whatsapp_connections` table
5. **Intent detection** → `extractTextIntent()` categorizes into commands or free text
6. **Command routing**:
   - `connect/disconnect` → Account management
   - `daily_summary/weekly_report/progress` → Read-only data queries via AI tools
   - `confirm/cancel` → Confirmation flow
   - `message` (default) → Full AI Coach conversation with tool execution
7. **Image handling** → Download media → analyze food via existing `/api/ai/analyze-food` → confirmation prompt
8. **Reply** → Send response via WhatsApp provider

### Commands

| Command | Triggers | Response |
|---------|----------|----------|
| Daily Summary | `summary`, `daily`, `ملخص`, `اليوم` | Today's calories, protein, steps, active mins |
| Weekly Report | `weekly`, `report`, `تقرير`, `الأسبوع` | Weekly progress summary |
| Progress | `progress`, `تقدم`, `فين` | Current progress data |
| Connect | `connect`, `link`, `ربط` | Connection status |
| Disconnect | `disconnect`, `unlink`, `فصل` | Disconnects account |
| Confirm | `confirm`, `ok`, `done`, `موافق` | Confirms pending action |
| Cancel | `cancel`, `no`, `إلغاء` | Cancels pending action |
| Free text | Anything else | AI Coach conversation |

## Database Tables

### whatsapp_connections

Links WhatsApp phone numbers to user profiles.

```sql
CREATE TABLE whatsapp_connections (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  provider TEXT NOT NULL DEFAULT 'cloud_api',
  external_user_id TEXT UNIQUE NOT NULL,
  phone_reference TEXT,
  status TEXT NOT NULL DEFAULT 'verified',
  language TEXT DEFAULT 'en',
  verified_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### whatsapp_message_log

Tracks processed messages for deduplication.

```sql
CREATE TABLE whatsapp_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_message_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### pending_whatsapp_meals

Stores food analysis results awaiting user confirmation.

```sql
CREATE TABLE pending_whatsapp_meals (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  items JSONB NOT NULL,
  total_calories NUMERIC,
  total_protein NUMERIC,
  total_carbs NUMERIC,
  total_fat NUMERIC,
  confidence NUMERIC,
  source TEXT DEFAULT 'whatsapp_image',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/whatsapp/webhook` | None | Webhook verification (Meta challenge) |
| POST | `/api/whatsapp/webhook` | None | Receive incoming messages |
| GET | `/api/whatsapp/status` | Bearer | Get connection status |
| POST | `/api/whatsapp/connect` | Bearer | Link WhatsApp account |
| POST | `/api/whatsapp/disconnect` | Bearer | Unlink WhatsApp account |
| POST | `/api/whatsapp/link-token` | Bearer | Generate linking token |

## Environment Variables

```env
# Server-side Supabase (required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# WhatsApp Configuration
WHATSAPP_PROVIDER=mock          # 'cloud_api' or 'mock'
WHATSAPP_APP_ID=                # Meta App ID
WHATSAPP_APP_SECRET=            # Meta App Secret
WHATSAPP_PHONE_NUMBER_ID=       # WhatsApp Business phone number ID
WHATSAPP_VERIFY_TOKEN=          # Webhook verification token
WHATSAPP_ACCESS_TOKEN=          # Cloud API access token
WHATSAPP_API_VERSION=v21.0      # Cloud API version
```

## Dashboard Settings

The WhatsApp settings card appears in the Profile tab, showing:
- Connection status (connected/disconnected)
- Connect/Disconnect button
- Setup instructions (when not connected)
- Feature capabilities list

## Testing

### Unit Tests

```bash
npx vitest run server/__tests__/normalizer.test.ts    # 21 tests
npx vitest run server/__tests__/provider.test.ts       # 13 tests
npx vitest run server/__tests__/deduplication.test.ts  # 4 tests
npx vitest run server/__tests__/linking.test.ts        # 10 tests
```

### MockProvider Test Helpers

```typescript
import { MockProvider } from './server/whatsapp/providers/mock';

// Static methods for testing
MockProvider.getSentMessages();          // Get all sent messages
MockProvider.clearSentMessages();        // Reset message store
MockProvider.getLastMessage();           // Get most recent message
MockProvider.setWebhookVerifyToken(t);   // Set verification token
```

### Simulating Webhook

```bash
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "entry_1",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": { "display_phone_number": "+1234567890", "phone_number_id": "pn_1" },
          "contacts": [{ "profile": { "name": "Test User" }, "wa_id": "1234567890" }],
          "messages": [{
            "from": "1234567890",
            "id": "msg_test_1",
            "timestamp": "1700000000",
            "type": "text",
            "text": { "body": "I ate chicken breast and rice for lunch" }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```
