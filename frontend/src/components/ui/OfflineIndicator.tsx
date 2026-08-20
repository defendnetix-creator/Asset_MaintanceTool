// frontend/src/components/ui/OfflineIndicator.tsx
// Offline/Online indicator component

import { useState, useEffect, useCallback } from 'react';
import { WifiOff, Wifi, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/helpers';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (!isOnline) {
        setWasOffline(true);
        // Auto-hide the "back online" message after 3 seconds
        setTimeout(() => setWasOffline(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
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

  // Don't show anything if online and not recently offline
  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 z-50 animate-slide-down',
      'px-4 py-2 transition-all duration-300',
      isOnline ? 'bg-green-500' : 'bg-amber-500'
    )}>
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-white font-medium">You're back online</span>
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4" />
            <span className="text-white font-medium">You're offline - changes will sync when reconnected</span>
          </>
        )}
      </div>
    </div>
  );
}