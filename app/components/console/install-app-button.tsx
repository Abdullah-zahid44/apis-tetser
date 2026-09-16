'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Installation still works on browsers that do not allow service workers.
      });
    }

    const displayMode = window.matchMedia('(display-mode: standalone)');
    const appleStandalone = (navigator as Navigator & { standalone?: boolean }).standalone;
    setInstalled(displayMode.matches || Boolean(appleStandalone));
    setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent));

    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    const onDisplayChange = () => setInstalled(displayMode.matches);

    window.addEventListener('beforeinstallprompt', onInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    displayMode.addEventListener('change', onDisplayChange);
    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      displayMode.removeEventListener('change', onDisplayChange);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (!promptEvent) {
      setShowInstructions(true);
      return;
    }
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    if (choice.outcome === 'accepted') setInstalled(true);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void install()}
        className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-[var(--surface-5)] gap-1.5"
        title="Install AssanPay Console as an app"
        aria-label="Install AssanPay Console as an app"
      >
        <Download size={14} />
        <span className="hidden xl:inline text-xs">Install app</span>
      </Button>
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install AssanPay Console</DialogTitle>
            <DialogDescription>
              {isIos
                ? 'In Safari, tap Share, then Add to Home Screen. Open this site in Safari if you are using another iPhone browser.'
                : 'Open your browser menu and choose Install app or Add to home screen. The option appears when your browser supports installation.'}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
