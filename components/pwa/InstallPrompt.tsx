"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone ===
          true;
      setIsStandalone(isStandaloneMode);
    };

    // Check if iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice =
        /iphone|ipad|ipod/.test(userAgent) &&
        !(window as Window & { MSStream?: unknown }).MSStream;
      setIsIOS(isIOSDevice);
    };

    checkStandalone();
    checkIOS();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if user has dismissed the banner before
      const dismissedTime = localStorage.getItem("pwa-banner-dismissed");
      if (dismissedTime) {
        const daysSinceDismissed =
          (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
          return; // Don't show for 7 days after dismissal
        }
      }

      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener("appinstalled", () => {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    });

    // Show iOS instructions after a delay
    if (!isStandalone) {
      const dismissedTime = localStorage.getItem("pwa-banner-dismissed");
      if (!dismissedTime) {
        setTimeout(() => {
          checkIOS();
          if (
            /iphone|ipad|ipod/.test(
              window.navigator.userAgent.toLowerCase()
            ) &&
            !window.matchMedia("(display-mode: standalone)").matches
          ) {
            setShowInstallBanner(true);
          }
        }, 3000);
      }
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem("pwa-banner-dismissed", Date.now().toString());
  };

  if (isStandalone || !showInstallBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="mx-auto max-w-md rounded-lg border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-card-foreground">
              Instalar Simulab
            </h3>
            {isIOS ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Toque em{" "}
                <span className="inline-flex items-center">
                  <svg
                    className="mx-1 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .9 2 2z" />
                  </svg>
                </span>{" "}
                e depois em &quot;Adicionar à Tela de Início&quot;
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                Instale o app para acesso rápido e offline
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {!isIOS && deferredPrompt && (
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleDismiss}
            >
              Agora não
            </Button>
            <Button size="sm" className="flex-1" onClick={handleInstallClick}>
              <Download className="mr-2 h-4 w-4" />
              Instalar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
