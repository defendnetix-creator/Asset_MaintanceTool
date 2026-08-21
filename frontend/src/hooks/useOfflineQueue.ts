// frontend/src/hooks/useOfflineQueue.ts
// Offline queue and background sync hook

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../components/ui/useToast';

interface QueuedAction {
  id: string;
  type: 'scan' | 'audit' | 'asset' | 'maintenance' | 'custom';
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

const STORAGE_KEY = 'assetmt_offline_queue';
const MAX_RETRIES = 3;

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const toast = useToast();
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load queue from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('assetmt_offline_queue');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setQueue(parsed);
      } catch (e) {
        console.error('Failed to parse offline queue:', e);
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('assetmt_offline_queue', JSON.stringify(queue));
  }, [queue]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online - syncing...');
      processQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Offline mode - changes will sync when online');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [toast]);

  // Add action to queue
  const enqueue = useCallback((action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>) => {
    const newAction: QueuedAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };
    setQueue(prev => [...prev, newAction]);
    toast.info('Action queued for sync');
  }, [toast]);

  // Remove action from queue
  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(action => action.id !== id));
  }, []);

  // Retry failed action
  const retryAction = useCallback((id: string) => {
    setQueue(prev => prev.map(action => 
      action.id === id ? { ...action, retryCount: 0 } : action
    ));
  }, []);

  // Process the queue
  const processQueue = useCallback(async () => {
    if (syncing || queue.length === 0 || !isOnline) return;

    setSyncing(true);
    toast.info('Syncing offline changes...');

    const pendingActions = queue.filter(action => action.retryCount < action.maxRetries);
    
    for (const action of pendingActions) {
      try {
        await processAction(action);
        removeFromQueue(action.id);
      } catch (error) {
        console.error('Failed to process action:', action.id, error);
        setQueue(prev => prev.map(a => 
          a.id === action.id 
            ? { ...a, retryCount: a.retryCount + 1 } 
            : a
        ));
      }
    }

    setSyncing(false);
    if (queue.length === 0) {
      toast.success('Sync complete');
    } else {
      toast.info(`${queue.length} actions remaining`);
    }
  }, [queue, isOnline, syncing, toast]);

  // Process individual action based on type
  const processAction = async (action: QueuedAction) => {
    const { type, payload } = action;
    
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    
    switch (type) {
      case 'scan':
        return fetch(`${baseUrl}/audits/${payload.auditId}/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ asset_tag: payload.tag, status: payload.status }),
        });

      case 'audit':
        return fetch(`${baseUrl}/audits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        );

      case 'asset':
        return fetch(`${baseUrl}/assets`, {
          method: payload.method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload.data),
        });

      case 'maintenance':
        return fetch(`${baseUrl}/maintenance`, {
          method: payload.method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload.data),
        );

      case 'custom':
        return fetch(payload.url, {
          method: payload.method,
          headers: { 'Content-Type': 'application/json', ...payload.headers },
          credentials: 'include',
          body: JSON.stringify(payload.body),
        );

      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  };

  // Background sync registration (for service worker)
  const registerBackgroundSync = useCallback(async (tag: string) => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register(tag);
        return true;
      } catch (error) {
        console.error('Background sync registration failed:', error);
        return false;
      }
    }
    return false;
  }, []);

  // Schedule periodic sync
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      if (queue.length > 0 && isOnline) {
        processQueue();
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isOnline, queue.length, processQueue]);

  // Helper functions for common actions
  const queueScan = useCallback((auditId: string, tag: string, status: string) => {
    enqueue({
      type: 'scan',
      payload: { auditId, tag, status },
      maxRetries: 3,
    });
  }, [enqueue]);

  const queueAuditCreate = useCallback((data: any) => {
    enqueue({
      type: 'audit',
      payload: data,
      maxRetries: 3,
    });
  }, [enqueue]);

  const queueAssetAction = useCallback((method: 'POST' | 'PUT' | 'DELETE', data: any) => {
    enqueue({
      type: 'asset',
      payload: { method, data },
      maxRetries: 3,
    });
  }, [enqueue]);

  const queueMaintenanceAction = useCallback((method: 'POST' | 'PUT' | 'DELETE', data: any) => {
    enqueue({
      type: 'maintenance',
      payload: { method, data },
      maxRetries: 3,
    });
  }, [enqueue]);

  return {
    queue,
    isOnline,
    syncing,
    enqueue,
    removeFromQueue,
    retryAction,
    processQueue,
    registerBackgroundSync,
    queueScan,
    queueAuditCreate,
    queueAssetAction,
    queueMaintenanceAction,
  };
}

// Hook for detecting online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Hook for deferred mutations (optimistic updates with offline support)
export function useDeferredMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
    offlineMessage?: string;
  }
) {
  const { isOnline, enqueue } = useOfflineQueue();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (variables: TVariables) => {
    setIsPending(true);
    setError(null);

    try {
      if (!navigator.onLine) {
        // Queue for later if offline
        throw new Error('OFFLINE');
      }

      const result = await mutationFn(variables);
      options?.onSuccess?.(result);
      return result;
    } catch (err: any) {
      if (err.message === 'OFFLINE' && options?.offlineMessage) {
        // Queue for later
        // This would need the enqueue function from useOfflineQueue
        // For now, just show message
      }
      setError(err);
      options?.onError?.(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { mutate, isPending, error };
}