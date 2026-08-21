// frontend/src/components/ui/OfflineIndicator.tsx
// Offline/Online indicator component with queue status

import { useState, useEffect, useCallback } from 'react';
import { WifiOff, Wifi, AlertTriangle, CheckCircle2, Sync } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';

export function OfflineIndicator() {
  const { isOnline, queue, syncing } = useOfflineQueue();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      if (!isOnline) {
        setWasOffline(true);
        // Auto-hide the "back online" message after 3 seconds
        setTimeout(() => setWasOffline(false), 3000);
      }
    };

    const handleOffline = () => {
      setWasOffline(false);
    };

    // Initial check
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  // Show indicator if offline, was recently offline, or syncing
  if (isOnline && !wasOffline && !syncing) {
    return null;
  }

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 z-50 animate-slide-down',
      'px-4 py-2 transition-all duration-300',
      syncing ? 'bg-blue-500' : isOnline ? 'bg-green-500' : 'bg-amber-500'
    )}>
      <div className="flex items-center justify-center gap-2">
        {syncing ? (
          <>
            <Sync className="h-4 w-4 animate-spin" />
            <span className="text-white font-medium">
              Syncing {queue.length} pending action{queue.length !== 1 ? 's' : ''}...
            </span>
          </>
        ) : isOnline ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-white font-medium">You're back online</span>
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4" />
            <span className="text-white font-medium">
              You're offline - {queue.length} action{queue.length !== 1 ? 's' : ''} queued for sync
            </span>
          </>
        )}
      </div>
    </div>
  );
}