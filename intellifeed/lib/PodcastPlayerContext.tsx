import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
  const modeRef = useRef<PlayerMode>(null);
  const [state, setState] = useState<PlayerState>(INITIAL);

  // Configure audio mode once — required for playback through Silent switch
  useEffect(() => {
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
    try { await Speech.stop(); } catch {}
  }, []);

  const stop: PodcastPlayerValue['stop'] = useCallback(async () => {
    await teardown();
    setState(INITIAL);
  }, [teardown]);

  const play: PodcastPlayerValue['play'] = useCallback(async (track) => {
    // Same track already playing through audio path → just resume
    if (state.track?.id === track.id && soundRef.current && modeRef.current === 'audio') {
      try { await soundRef.current.playAsync(); } catch {}
      return;
    }

    await teardown();

    // Make sure the session is set to playback right before we start
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch {}

    setState({
      track,
      mode: null,
      isPlaying: false,
      isLoading: true,
      positionMs: 0,
      durationMs: 0,
      error: null,
    });

    // 1) MP3 path — preferred when audioUrl exists
    if (track.audioUrl) {
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

    // 2) Device TTS path — narrates the provided text
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
  }, [state.track?.id, onStatus, teardown, stop]);

  const pause = useCallback(async () => {
    if (modeRef.current === 'audio') {
      try { await soundRef.current?.pauseAsync(); } catch {}
    } else if (modeRef.current === 'tts') {
      // expo-speech doesn't support pause uniformly; treat pause as stop
      await stop();
    }
  }, [stop]);

  const resume = useCallback(async () => {
    if (modeRef.current === 'audio') {
      try { await soundRef.current?.playAsync(); } catch {}
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
    try { await soundRef.current?.setPositionAsync(ms); } catch {}
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
