'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Newspaper, ListChecks, Users, User } from 'lucide-react';

const tabs = [
  { href: '/feed', icon: Newspaper, label: 'Feed' },
  { href: '/plan', icon: ListChecks, label: 'Plan' },
  { href: '/clubs', icon: Users, label: 'Clubs' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      className="sticky bottom-0 left-0 right-0 z-50 flex items-center border-t"
      style={{
        backgroundColor: 'rgba(20, 20, 20, 0.95)',
        backdropFilter: 'blur(12px)',
        borderColor: '#2A2A2A',
        height: '80px',
        paddingBottom: '16px',
      }}
    >
      {tabs.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-opacity active:opacity-70"
          >
            <Icon
              size={22}
              style={{ color: isActive ? '#D48B2C' : '#888888' }}
              strokeWidth={isActive ? 2.5 : 1.8}
            />
            <span
              className="text-[11px] font-medium"
              style={{ color: isActive ? '#D48B2C' : '#888888' }}
            >
              {label}
            </span>
            {isActive && (
              <span
                className="absolute bottom-0 w-8 h-[2px] rounded-full"
                style={{ backgroundColor: '#D48B2C' }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
