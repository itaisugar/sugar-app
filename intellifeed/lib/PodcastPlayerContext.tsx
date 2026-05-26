import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';

type Episode = {
  id: string;
  title: string;
  source: string;
  audioUrl: string;
  imageUrl?: string | null;
};

type PlayerState = {
  episode: Episode | null;
  isPlaying: boolean;
  isLoading: boolean;
  positionMs: number;
  durationMs: number;
  error: string | null;
};

type PodcastPlayerValue = PlayerState & {
  play: (episode: Episode) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (ms: number) => Promise<void>;
  isActive: (episodeId: string) => boolean;
};

const PodcastPlayerContext = createContext<PodcastPlayerValue | undefined>(undefined);

export function PodcastPlayerProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [state, setState] = useState<PlayerState>({
    episode: null,
    isPlaying: false,
    isLoading: false,
    positionMs: 0,
    durationMs: 0,
    error: null,
  });

  // Configure audio mode once
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch(() => {});
  }, []);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
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
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
  }, []);

  const play: PodcastPlayerValue['play'] = useCallback(async (episode) => {
    // If same episode is already loaded, just resume
    if (state.episode?.id === episode.id && soundRef.current) {
      try {
        await soundRef.current.playAsync();
      } catch (e) {
        setState((s) => ({ ...s, error: 'Could not resume playback.' }));
      }
      return;
    }

    // New episode — tear down previous and start fresh
    await teardown();
    setState({
      episode,
      isPlaying: false,
      isLoading: true,
      positionMs: 0,
      durationMs: 0,
      error: null,
    });

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: episode.audioUrl },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        onStatus,
      );
      soundRef.current = sound;
    } catch (e: any) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: e?.message ?? 'Could not load this episode.',
      }));
    }
  }, [state.episode?.id, onStatus, teardown]);

  const pause = useCallback(async () => {
    try {
      await soundRef.current?.pauseAsync();
    } catch {}
  }, []);

  const resume = useCallback(async () => {
    try {
      await soundRef.current?.playAsync();
    } catch {}
  }, []);

  const stop = useCallback(async () => {
    await teardown();
    setState({
      episode: null,
      isPlaying: false,
      isLoading: false,
      positionMs: 0,
      durationMs: 0,
      error: null,
    });
  }, [teardown]);

  const seekTo = useCallback(async (ms: number) => {
    try {
      await soundRef.current?.setPositionAsync(ms);
    } catch {}
  }, []);

  const isActive = useCallback((episodeId: string) => state.episode?.id === episodeId, [state.episode?.id]);

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
