/**
 * Settings Navigation Component
 *
 * Purpose: Shared navigation for all settings pages
 * Design: Sidebar navigation with active state highlighting
 *
 * Created: 2025-11-10
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SettingsNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/settings/account', label: 'Account', icon: '👤' },
    { href: '/settings/privacy', label: 'Privacy', icon: '🔒' },
    { href: '/settings/security', label: 'Security', icon: '🛡️' }
  ];

  return (
    <nav className="bg-white/5 border border-white/15 rounded-2xl p-6 mb-6">
      <ul className="flex gap-2">
        {navItems.map(item => {
          const isActive = pathname === item.href;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                  ${isActive
                    ? 'bg-gradient-to-br from-cyan-dark to-cyan-light text-black'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
