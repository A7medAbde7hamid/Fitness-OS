import React from 'react';
import { useConnection } from '../../context/ConnectionContext';
import { useI18n } from '../../context/I18nContext';

export const ConnectionStatus: React.FC = () => {
  const { status, pendingCount, failedCount, syncNow } = useConnection();
  const { t } = useI18n();

  if (status === 'online' && pendingCount === 0 && failedCount === 0) return null;

  const statusConfig = {
    offline: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', key: 'connection.offline' },
    syncing: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', key: 'connection.syncing' },
    synced: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', key: 'connection.synced' },
    sync_error: { color: 'bg-red-500/20 text-red-400 border-red-500/30', key: 'connection.syncError' },
    online: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', key: 'connection.online' },
  };

  const config = statusConfig[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-xs font-medium border-b backdrop-blur-md ${config.color}`}
    >
      <div className="flex items-center justify-center gap-2">
        <span>{t(config.key)}</span>
        {pendingCount > 0 && (
          <span className="opacity-70">
            ({pendingCount} {t('connection.pending')})
          </span>
        )}
        {failedCount > 0 && (
          <button
            onClick={syncNow}
            className="underline ml-2 hover:opacity-80"
            aria-label={t('connection.retryAll')}
          >
            {t('connection.retryAll')}
          </button>
        )}
        {status === 'syncing' && (
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    </div>
  );
};
