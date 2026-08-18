import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { ConnectionStatusType } from '../types';
import { SyncQueueService } from '../services/syncQueue';

export interface ConnectionContextType {
  status: ConnectionStatusType;
  isOnline: boolean;
  isOffline: boolean;
  pendingCount: number;
  failedCount: number;
  syncNow: () => Promise<void>;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<ConnectionStatusType>(
    navigator.onLine ? 'online' : 'offline'
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const syncCallbackRef = useRef<((op: import('../types').SyncOperation) => Promise<boolean>) | null>(null);

  const updateCounts = useCallback(async () => {
    try {
      const counts = await SyncQueueService.getCount();
      setPendingCount(counts.pending);
      setFailedCount(counts.failed);
    } catch {
      // IndexedDB may not be available
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setStatus('online');
      updateCounts();
    };

    const handleOffline = () => {
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    updateCounts();

    const unsubscribe = SyncQueueService.onQueueChange(updateCounts);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, [updateCounts]);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine || !syncCallbackRef.current) return;
    setStatus('syncing');
    try {
      await SyncQueueService.processQueue(syncCallbackRef.current);
      setStatus('synced');
      setTimeout(() => setStatus('online'), 2000);
    } catch {
      setStatus('sync_error');
      setTimeout(() => setStatus('online'), 3000);
    }
    updateCounts();
  }, [updateCounts]);

  const setSyncExecutor = useCallback((executor: (op: import('../types').SyncOperation) => Promise<boolean>) => {
    syncCallbackRef.current = executor;
  }, []);

  return (
    <ConnectionContext.Provider
      value={{
        status,
        isOnline: status === 'online' || status === 'synced',
        isOffline: status === 'offline',
        pendingCount,
        failedCount,
        syncNow,
      }}
    >
      {children}
      <ConnectionStatusInner setSyncExecutor={setSyncExecutor} />
    </ConnectionContext.Provider>
  );
};

const ConnectionStatusInner: React.FC<{
  setSyncExecutor: (executor: (op: import('../types').SyncOperation) => Promise<boolean>) => void;
}> = ({ setSyncExecutor }) => {
  const { isOnline } = useConnection();

  useEffect(() => {
    // Import dynamically to avoid circular deps
    import('../services/connectionStatus').then(({ ConnectionStatusService }) => {
      setSyncExecutor(ConnectionStatusService.executeSyncOperation);
    });
  }, [setSyncExecutor]);

  useEffect(() => {
    if (isOnline) {
      import('../services/connectionStatus').then(({ ConnectionStatusService }) => {
        ConnectionStatusService.onReconnect();
      });
    }
  }, [isOnline]);

  return null;
};

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};
