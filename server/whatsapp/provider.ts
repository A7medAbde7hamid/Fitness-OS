import { WhatsAppProvider, WhatsAppProviderType } from '../../src/types';
import { CloudAPIProvider } from './providers/cloudApi';
import { MockProvider } from './providers/mock';

let instance: WhatsAppProvider | null = null;

export function getWhatsAppProvider(): WhatsAppProvider {
  if (instance) return instance;

  const providerType = (process.env.WHATSAPP_PROVIDER || 'mock') as WhatsAppProviderType;

  switch (providerType) {
    case 'cloud_api':
      instance = new CloudAPIProvider({
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
        apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
      });
      break;
    case 'mock':
    default:
      instance = new MockProvider();
      break;
  }

  return instance;
}

export function resetWhatsAppProvider(): void {
  instance = null;
}
