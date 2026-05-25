'use client';

import { Bell, Search } from 'lucide-react';
import Link from 'next/link';

interface TopBarProps {
  title?: string;
  showLogo?: boolean;
  showSearch?: boolean;
  rightElement?: React.ReactNode;
}

export default function TopBar({
  title,
  showLogo = false,
  showSearch = false,
  rightElement,
}: TopBarProps) {
  return (
    <div
      className="sticky top-0 z-40 flex items-center justify-between px-4 border-b"
      style={{
        height: '56px',
        backgroundColor: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(12px)',
        borderColor: '#2A2A2A',
      }}
    >
      {/* Left: Logo or Title */}
      <div className="flex items-center gap-2">
        {showLogo ? (
          <Link href="/feed" className="flex items-center gap-1.5">
            <span style={{ color: '#D48B2C', fontSize: '20px' }}>✦</span>
            <span
              className="font-bold tracking-tight"
              style={{ fontSize: '18px', color: '#F5F5F5', letterSpacing: '-0.02em' }}
            >
              sugar
            </span>
          </Link>
        ) : (
          <h1
            className="font-semibold"
            style={{ fontSize: '17px', color: '#F5F5F5' }}
          >
            {title}
          </h1>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {showSearch && (
          <button className="p-1 transition-opacity active:opacity-60">
            <Search size={20} style={{ color: '#888888' }} />
          </button>
        )}
        {rightElement || (
          <button className="relative p-1 transition-opacity active:opacity-60">
            <Bell size={20} style={{ color: '#888888' }} />
            <span
              className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full border-2"
              style={{ backgroundColor: '#D48B2C', borderColor: '#0A0A0A' }}
            />
          </button>
        )}
      </div>
    </div>
  );
}
