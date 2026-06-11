import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';

// The browser fires `beforeinstallprompt` (Chrome/Edge/Android/desktop) to let
// us defer the native "Add to Home Screen" prompt and trigger it later from our
// own button. iOS Safari has no such API — there we surface manual Share-sheet
// instructions instead. This hook unifies both paths for the web build and is a
// harmless no-op on native (where the app is already "installed").

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const READY_EVENT = 'sapience:installready';
const INSTALLED_EVENT = 'sapience:installed';

// Module-scoped capture: `beforeinstallprompt` can fire before the Profile
// screen mounts, and Chrome only fires it once per page load — so we stash the
// latest event here and re-broadcast a local event the hook can subscribe to.
let deferredPrompt: BeforeInstallPromptEvent | null = null;

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event(READY_EVENT));
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.dispatchEvent(new Event(INSTALLED_EVENT));
  });
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    // iOS Safari exposes its home-screen flag here instead of via matchMedia.
    (window.navigator as any).standalone === true
  );
}

function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isClassicIOS = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ masquerades as desktop Safari; fall back to touch-point sniffing.
  const isIPadOS = navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1;
  return isClassicIOS || isIPadOS;
}

export type PwaInstall = {
  /** Running on the web build (false on native iOS/Android). */
  supported: boolean;
  /** A native install prompt is ready (Chrome / Edge / Android). */
  canPrompt: boolean;
  /** iOS Safari — needs manual "Add to Home Screen" instructions. */
  isIOS: boolean;
  /** Already installed / launched from the home screen. */
  isStandalone: boolean;
  /** Fire the native prompt. Resolves to the user's choice or 'unavailable'. */
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
};

export function usePwaInstall(): PwaInstall {
  const isWeb = Platform.OS === 'web';
  const [canPrompt, setCanPrompt] = useState<boolean>(isWeb && !!deferredPrompt);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    if (!isWeb) return;
    setCanPrompt(!!deferredPrompt);
    setIsStandalone(detectStandalone());
    const onReady = () => setCanPrompt(true);
    const onInstalled = () => {
      setCanPrompt(false);
      setIsStandalone(true);
    };
    window.addEventListener(READY_EVENT, onReady);
    window.addEventListener(INSTALLED_EVENT, onInstalled);
    return () => {
      window.removeEventListener(READY_EVENT, onReady);
      window.removeEventListener(INSTALLED_EVENT, onInstalled);
    };
  }, [isWeb]);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return 'unavailable' as const;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    setCanPrompt(false);
    return outcome;
  }, []);

  return {
    supported: isWeb,
    canPrompt,
    isIOS: isWeb && detectIOS(),
    isStandalone,
    promptInstall,
  };
}
