'use client';

import { Globe, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Language = 'English' | 'Hebrew';

const LANGUAGES: Language[] = ['English', 'Hebrew'];

export default function LanguageMenu() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Language>('English');
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Translate"
        className="p-1 transition-opacity active:opacity-60"
      >
        <Globe size={20} style={{ color: open ? '#D48B2C' : '#888888' }} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-40 rounded-xl border overflow-hidden animate-slide-up z-50"
          style={{
            backgroundColor: '#141414',
            borderColor: '#2A2A2A',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          }}
        >
          {LANGUAGES.map((lang) => {
            const isActive = lang === selected;
            return (
              <button
                key={lang}
                onClick={() => {
                  setSelected(lang);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 transition-colors active:opacity-70"
                style={{
                  color: isActive ? '#D48B2C' : '#F5F5F5',
                  fontSize: '14px',
                }}
              >
                <span className="font-medium">{lang}</span>
                {isActive && <Check size={15} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
