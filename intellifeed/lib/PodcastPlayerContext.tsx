import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Speech from 'expo-speech';

// A "track" can be either a real MP3 (audioUrl) or a chunk of text to read
// aloud via the device TTS (ttsText). The player picks the highest-quality
// path that's available.
type Track = {
  id: string;
  title: string;
  source: string;
  audioUrl?: string | null;
  imageUrl?: string | null;
  ttsText?: string;
};

type PlayerMode = 'audio' | 'tts' | null;

type PlayerState = {
  track: Track | null;
  mode: PlayerMode;
  isPlaying: boolean;
  isLoading: boolean;
  positionMs: number;
  durationMs: number;
  error: string | null;
};

type PodcastPlayerValue = PlayerState & {
  play: (track: Track) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (ms: number) => Promise<void>;
  isActive: (trackId: string) => boolean;
};

const PodcastPlayerContext = createContext<PodcastPlayerValue | undefined>(undefined);

const isWeb = Platform.OS === 'web';

const INITIAL: PlayerState = {
  track: null,
  mode: null,
  isPlaying: false,
  isLoading: false,
  positionMs: 0,
  durationMs: 0,
  error: null,
};

export function PodcastPlayerProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  // On web we drive a native HTMLAudioElement directly — expo-av's web audio
  // support is unreliable (autoplay handling, buffering events), so we bypass it.
  const webAudioRef = useRef<HTMLAudioElement | null>(null);
  const modeRef = useRef<PlayerMode>(null);
  const [state, setState] = useState<PlayerState>(INITIAL);

  // Configure audio mode once — required for playback through Silent switch.
  // No-op on web.
  useEffect(() => {
    if (isWeb) return;
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch(() => {});
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      if (webAudioRef.current) {
        try { webAudioRef.current.pause(); webAudioRef.current.src = ''; } catch {}
      }
      Speech.stop().catch(() => {});
    };
  }, []);

  const onStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setState((s) => ({
      ...s,
      isPlaying: status.isPlaying,
      positionMs: status.positionMillis ?? 0,
      durationMs: status.durationMillis ?? s.durationMs,
      isLoading: status.isBuffering && !status.isPlaying,
    }));
  }, []);

  const teardown = useCallback(async () => {
    modeRef.current = null;
    if (soundRef.current) {
      try { await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
    if (webAudioRef.current) {
      const el = webAudioRef.current;
      webAudioRef.current = null;
      try { el.pause(); el.removeAttribute('src'); el.load(); } catch {}
    }
    try { await Speech.stop(); } catch {}
  }, []);

  const stop: PodcastPlayerValue['stop'] = useCallback(async () => {
    await teardown();
    setState(INITIAL);
  }, [teardown]);

  // Build & wire up a browser <audio> element that mirrors its state into React.
  const createWebAudio = useCallback((url: string): HTMLAudioElement => {
    const el = new (window as unknown as { Audio: { new (): HTMLAudioElement } }).Audio();
    el.preload = 'auto';
    el.src = url;
    el.addEventListener('loadedmetadata', () => {
      setState((s) => ({ ...s, durationMs: isFinite(el.duration) ? el.duration * 1000 : s.durationMs }));
    });
    el.addEventListener('timeupdate', () => {
      setState((s) => ({
        ...s,
        positionMs: el.currentTime * 1000,
        durationMs: isFinite(el.duration) ? el.duration * 1000 : s.durationMs,
      }));
    });
    el.addEventListener('playing', () => setState((s) => ({ ...s, isPlaying: true, isLoading: false })));
    el.addEventListener('pause', () => setState((s) => ({ ...s, isPlaying: false })));
    el.addEventListener('waiting', () => setState((s) => ({ ...s, isLoading: true })));
    el.addEventListener('ended', () => { stop(); });
    return el;
  }, [stop]);

  const play: PodcastPlayerValue['play'] = useCallback(async (track) => {
    // Same track already loaded through the audio path → just resume in place.
    if (state.track?.id === track.id && modeRef.current === 'audio') {
      if (webAudioRef.current) { try { await webAudioRef.current.play(); } catch {} return; }
      if (soundRef.current) { try { await soundRef.current.playAsync(); } catch {} return; }
    }

    await teardown();

    // Make sure the session is set to playback right before we start (native only).
    if (!isWeb) {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch {}
    }

    setState({
      track,
      mode: null,
      isPlaying: false,
      isLoading: true,
      positionMs: 0,
      durationMs: 0,
      error: null,
    });

    // 1) MP3 path — preferred when audioUrl exists.
    if (track.audioUrl) {
      // 1a) Web: drive a native <audio> element.
      if (isWeb) {
        try {
          const el = createWebAudio(track.audioUrl);
          webAudioRef.current = el;
          modeRef.current = 'audio';
          setState((s) => ({ ...s, mode: 'audio' }));
          try {
            await el.play();
          } catch {
            // Autoplay was blocked (the user gesture went stale during the
            // few seconds it took to generate the briefing). Leave it cued so
            // the user can start it with a fresh tap.
            setState((s) => ({ ...s, isPlaying: false, isLoading: false }));
          }
          return;
        } catch {
          // fall through to TTS
          webAudioRef.current = null;
        }
      } else {
        // 1b) Native: expo-av.
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: track.audioUrl },
            { shouldPlay: true, progressUpdateIntervalMillis: 500 },
            onStatus,
          );
          soundRef.current = sound;
          modeRef.current = 'audio';
          setState((s) => ({ ...s, mode: 'audio' }));
          return;
        } catch {
          // fall through to TTS
        }
      }
    }

    // 2) TTS path — narrates the provided text (Web Speech API on web,
    //    device TTS on native).
    if (track.ttsText && track.ttsText.length > 0) {
      modeRef.current = 'tts';
      setState((s) => ({ ...s, mode: 'tts', isPlaying: true, isLoading: false }));
      Speech.speak(track.ttsText, {
        rate: 0.95,
        pitch: 1.0,
        volume: 1.0,
        onDone: () => { stop(); },
        onStopped: () => { stop(); },
        onError: () => { stop(); },
      });
      return;
    }

    // Nothing to play
    setState((s) => ({ ...s, isLoading: false, error: 'No audio for this piece.' }));
  }, [state.track?.id, onStatus, teardown, stop, createWebAudio]);

  const pause = useCallback(async () => {
    if (modeRef.current === 'audio') {
      if (webAudioRef.current) { try { webAudioRef.current.pause(); } catch {} }
      else { try { await soundRef.current?.pauseAsync(); } catch {} }
    } else if (modeRef.current === 'tts') {
      // expo-speech doesn't support pause uniformly; treat pause as stop
      await stop();
    }
  }, [stop]);

  const resume = useCallback(async () => {
    if (modeRef.current === 'audio') {
      if (webAudioRef.current) { try { await webAudioRef.current.play(); } catch {} }
      else { try { await soundRef.current?.playAsync(); } catch {} }
    } else if (modeRef.current === 'tts' && state.track?.ttsText) {
      // Restart TTS from the beginning since pause isn't real
      Speech.speak(state.track.ttsText, {
        rate: 0.95,
        pitch: 1.0,
        volume: 1.0,
        onDone: () => { stop(); },
        onStopped: () => { stop(); },
        onError: () => { stop(); },
      });
      setState((s) => ({ ...s, isPlaying: true }));
    }
  }, [state.track?.ttsText, stop]);

  const seekTo = useCallback(async (ms: number) => {
    if (modeRef.current !== 'audio') return;
    if (webAudioRef.current) { try { webAudioRef.current.currentTime = ms / 1000; } catch {} }
    else { try { await soundRef.current?.setPositionAsync(ms); } catch {} }
  }, []);

  const isActive = useCallback((trackId: string) => state.track?.id === trackId, [state.track?.id]);

  return (
    <PodcastPlayerContext.Provider
      value={{ ...state, play, pause, resume, stop, seekTo, isActive }}
    >
      {children}
    </PodcastPlayerContext.Provider>
  );
}

export function usePodcastPlayer() {
  const ctx = useContext(PodcastPlayerContext);
  if (!ctx) throw new Error('usePodcastPlayer must be used within PodcastPlayerProvider');
  return ctx;
}
