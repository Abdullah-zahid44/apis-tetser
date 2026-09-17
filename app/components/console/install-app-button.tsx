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
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Download size={16} className="text-primary" />
              Install AssanPay Console
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Install the console directly onto your home screen for quick access and full-screen experience.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            {isIos ? (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/60 border border-border">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">1</span>
                  <p className="leading-snug">
                    Open this site in <strong className="text-foreground">Safari</strong> and tap the <strong className="text-foreground">Share</strong> icon (square with arrow up) at the bottom toolbar.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/60 border border-border">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">2</span>
                  <p className="leading-snug">
                    Scroll down and select <strong className="text-foreground">Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/60 border border-border">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">3</span>
                  <p className="leading-snug">
                    Tap <strong className="text-foreground">Add</strong> in the top-right corner to finish.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/60 border border-border">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">1</span>
                  <p className="leading-snug">
                    Tap the <strong className="text-foreground">three dots menu (⋮)</strong> in your browser (Chrome, Edge, or Samsung Internet).
                  </p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/60 border border-border">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">2</span>
                  <p className="leading-snug">
                    Choose <strong className="text-foreground">Install app</strong> or <strong className="text-foreground">Add to Home screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/60 border border-border">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">3</span>
                  <p className="leading-snug">
                    Confirm prompt to launch AssanPay as a standalone standalone app.
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
