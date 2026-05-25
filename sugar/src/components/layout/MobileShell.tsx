'use client';

import { ReactNode } from 'react';
import BottomNav from './BottomNav';

export default function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black flex justify-center">
      {/* Left/right decorative gradient for wider screens */}
      <div
        className="hidden lg:block fixed inset-y-0 left-0 right-1/2 -translate-x-[195px]"
        style={{ background: 'linear-gradient(to right, #000 80%, transparent)' }}
      />
      <div
        className="hidden lg:block fixed inset-y-0 left-1/2 right-0 translate-x-[195px]"
        style={{ background: 'linear-gradient(to left, #000 80%, transparent)' }}
      />

      {/* Phone container */}
      <div
        className="relative w-full flex flex-col"
        style={{
          maxWidth: '390px',
          backgroundColor: '#0A0A0A',
          minHeight: '100vh',
        }}
      >
        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ paddingBottom: '80px' }}>
          {children}
        </main>

        {/* Bottom navigation */}
        <BottomNav />
      </div>
    </div>
  );
}
