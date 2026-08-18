import React, { useState, useEffect } from 'react';
import { useConnection } from '../../context/ConnectionContext';
import { useI18n } from '../../context/I18nContext';
import { SyncQueueService } from '../../services/syncQueue';
import { SyncOperation } from '../../types';

export const SyncStatus: React.FC = () => {
  const { pendingCount, failedCount, syncNow, isOnline } = useConnection();
  const { t } = useI18n();
  const [operations, setOperations] = useState<SyncOperation[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    SyncQueueService.getQueue().then(setOperations);
    const unsub = SyncQueueService.onQueueChange(() => {
      SyncQueueService.getQueue().then(setOperations);
    });
    return unsub;
  }, []);

  if (pendingCount === 0 && failedCount === 0) return null;

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full px-4 py-3 flex items-center justify-between text-sm"
        aria-expanded={showDetails}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="text-gray-300">{t('sync.status')}</span>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
              {pendingCount} {t('sync.pending')}
            </span>
          )}
          {failedCount > 0 && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
              {failedCount} {t('sync.failed')}
            </span>
          )}
        </div>
      </button>

      {showDetails && (
        <div className="px-4 pb-3 space-y-2">
          {operations.slice(0, 10).map((op) => (
            <div key={op.id} className="flex items-center justify-between text-xs py-1 border-t border-white/5">
              <span className="text-gray-400">{op.type}</span>
              <span className={
                op.status === 'synced' ? 'text-emerald-400' :
                op.status === 'failed' ? 'text-red-400' :
                op.status === 'syncing' ? 'text-blue-400' :
                'text-amber-400'
              }>
                {t(`sync.${op.status}`)}
              </span>
            </div>
          ))}
          <button
            onClick={syncNow}
            disabled={!isOnline}
            className="w-full mt-2 px-3 py-2 rounded-lg bg-[#FF4E00] text-white text-xs font-medium hover:bg-[#FF6B20] transition-colors disabled:opacity-50"
          >
            {t('sync.retryAll')}
          </button>
        </div>
      )}
    </div>
  );
};
