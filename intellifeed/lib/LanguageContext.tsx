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
  pending: Set<string>;
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

  const getTranslation = useCallback((id: string) => cache[id], [cache]);

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, toggle, getTranslation, ensureTranslation, ensureTranslations, pending }}
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
