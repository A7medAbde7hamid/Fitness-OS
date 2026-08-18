import React, { useState, useEffect } from 'react';
import { MessageCircle, Check, X, ChevronRight, Loader2, Smartphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { AuthService } from '../../services/auth';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface WhatsAppStatus {
  connected: boolean;
  status?: string;
  lastMessageAt?: string;
}

export const WhatsAppSettings: React.FC = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [status, setStatus] = useState<WhatsAppStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const getToken = () => AuthService.getSession()?.token || '';

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // WhatsApp not configured or not connected
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/whatsapp/link-token', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setMessage(t('whatsapp.linkSuccess'));
        await fetchStatus();
      }
    } catch {
      // Connection failed
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setStatus({ connected: false });
        setMessage(t('whatsapp.unlinkSuccess'));
      }
    } catch {
      // Disconnection failed
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <GlassCard variant="card" className="p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-[#FF6B2B] animate-spin" />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="card" className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-[#25D366]/15">
          <MessageCircle className="w-5 h-5 text-[#25D366]" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {t('whatsapp.title')}
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            {t('whatsapp.subtitle')}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-400">{t('common.status')}</span>
        <Badge
          variant={status.connected ? 'emerald' : 'neutral'}
          size="sm"
        >
          {status.connected ? t('whatsapp.connected') : t('whatsapp.disconnected')}
        </Badge>
      </div>

      {status.connected && status.lastMessageAt && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-400">{t('whatsapp.lastMessage')}</span>
          <span className="text-xs text-neutral-300">
            {new Date(status.lastMessageAt).toLocaleDateString()}
          </span>
        </div>
      )}

      {/* Action */}
      {status.connected ? (
        <Button
          variant="danger"
          size="md"
          onClick={handleDisconnect}
          disabled={actionLoading}
          leftIcon={actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          className="w-full"
        >
          {t('whatsapp.disconnect')}
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="md"
          onClick={handleConnect}
          disabled={actionLoading}
          leftIcon={actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          className="w-full"
        >
          {t('whatsapp.connect')}
        </Button>
      )}

      {message && (
        <p className="text-xs text-[#FF6B2B] font-semibold text-center">{message}</p>
      )}

      {/* Instructions (when not connected) */}
      {!status.connected && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            {t('whatsapp.instructions')}
          </h4>
          <div className="space-y-2">
            {[
              t('whatsapp.step1'),
              t('whatsapp.step2'),
              t('whatsapp.step3'),
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#FF6B2B]/20 text-[#FF6B2B] text-[10px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <span className="text-xs text-neutral-300">{step}</span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              {t('whatsapp.capabilities')}
            </h4>
            <div className="space-y-1">
              {[
                t('whatsapp.capMeals'),
                t('whatsapp.capProgress'),
                t('whatsapp.capSummary'),
                t('whatsapp.capCoach'),
              ].map((cap, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-[#25D366] shrink-0" />
                  <span className="text-xs text-neutral-300">{cap}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
};
