import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translateItem, Translation } from './translate';

export type Language = 'en' | 'he';

type Cache = Record<string, Translation>;

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggle: () => void;
  getTranslation: (id: string) => Translation | undefined;
  ensureTranslation: (id: string) => Promise<Translation>;
  ensureTranslations: (ids: string[]) => Promise<void>;
  seedTranslations: (items: SeedItem[]) => void;
  pending: Set<string>;
};

// Hebrew already stored on the content row — seeded into the cache so a switch
// to Hebrew is instant, with no round-trip.
export type SeedItem = {
  id: string;
  titleHe: string | null;
  hookHe: string | null;
  summaryHe: string | null;
};

const STORAGE_KEY = 'sapience.language';
const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [cache, setCache] = useState<Cache>({});
  const [pending, setPending] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'he' || v === 'en') setLanguageState(v);
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    setLanguageState((prev) => {
      const next = prev === 'en' ? 'he' : 'en';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const ensureTranslation = useCallback(
    async (id: string): Promise<Translation> => {
      if (cache[id]) return cache[id];
      const t = await translateItem(id);
      setCache((prev) => ({ ...prev, [id]: t }));
      return t;
    },
    [cache],
  );

  const ensureTranslations = useCallback(
    async (ids: string[]) => {
      const missing = ids.filter((id) => !cache[id] && !pending.has(id));
      if (missing.length === 0) return;
      setPending((prev) => {
        const next = new Set(prev);
        missing.forEach((id) => next.add(id));
        return next;
      });
      const results = await Promise.allSettled(missing.map((id) => translateItem(id)));
      const updates: Cache = {};
      results.forEach((res, i) => {
        if (res.status === 'fulfilled') updates[missing[i]] = res.value;
      });
      setCache((prev) => ({ ...prev, ...updates }));
      setPending((prev) => {
        const next = new Set(prev);
        missing.forEach((id) => next.delete(id));
        return next;
      });
    },
    [cache, pending],
  );

  const seedTranslations = useCallback((items: SeedItem[]) => {
    setCache((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const it of items) {
        // Only seed rows that carry a full Hebrew payload, and never clobber a
        // translation already in the cache (e.g. a fresh on-demand one).
        if (it.titleHe && it.summaryHe && !next[it.id]) {
          next[it.id] = { title_he: it.titleHe, hook_he: it.hookHe ?? null, summary_he: it.summaryHe };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const getTranslation = useCallback((id: string) => cache[id], [cache]);

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, toggle, getTranslation, ensureTranslation, ensureTranslations, seedTranslations, pending }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
