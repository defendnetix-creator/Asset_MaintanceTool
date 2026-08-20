// frontend/src/components/ui/PWAInstallPrompt.tsx
// PWA Install Prompt component

import { useState, useEffect, useCallback } from 'react';
import { Download, X, Monitor, Smartphone } from 'lucide-react';
import { cn } from '../../utils/helpers';

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if app is already installed
  const checkInstalled = useCallback(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    return isStandalone || isInStandaloneMode;
  }, []);

  useEffect(() => {
    if (checkInstalled()) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed
    const dismissedBefore = localStorage.getItem('pwa-install-dismissed');
    if (dismissedBefore) {
      setDismissed(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a short delay
      setTimeout(() => setShowPrompt(true), 5000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [checkInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (isInstalled || dismissed || !deferredPrompt) {
    return null;
  }

  return (
    <div className={cn(
      'fixed bottom-4 right-4 z-50 animate-slide-up',
      'sm:bottom-6 sm:right-6'
    )}>
      <div className="card w-full max-w-sm shadow-xl border-border">
        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Install App</h4>
                <p className="text-sm text-muted-foreground">
                  Add Asset Maintenance Tool to your home screen for quick access
                </p>
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Desktop</span>
            <Smartphone className="h-4 w-4 text-muted-foreground ml-auto" />
            <span className="text-sm text-muted-foreground">Mobile</span>
          </div>

          <button
            onClick={handleInstall}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            Install App
          </button>

          <p className="text-xs text-muted-foreground text-center">
            Works offline · Fast access · No app store needed
          </p>
        </div>
      </div>
    </div>
  );
}

// Type augmentation for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}