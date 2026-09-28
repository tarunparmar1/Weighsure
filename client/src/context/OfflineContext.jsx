import React, { createContext, useState, useEffect } from 'react';
import { getSyncQueue } from '../services/offlineStore';
import { syncOfflineData } from '../services/syncManager';

export const OfflineContext = createContext();

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const checkQueue = async () => {
    try {
      const q = await getSyncQueue();
      setPendingQueueCount(q.length);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkQueue();
    const interval = setInterval(checkQueue, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const triggerSync = async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    await syncOfflineData();
    await checkQueue();
    setIsSyncing(false);
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        pendingQueueCount,
        isSyncing,
        triggerSync,
        checkQueue,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}
