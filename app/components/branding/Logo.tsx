/**
 * Logo Component
 *
 * Purpose: Nutri branding logo with gradient text
 * Features: Links to homepage, responsive sizing, cyan-magenta gradient
 *
 * Generated: 2025-11-11
 * Architecture: Global Branding Component
 */

import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <Link
      href="/"
      className={`
        font-bold
        bg-gradient-to-r from-cyan-light via-cyan to-magenta-light
        bg-clip-text text-transparent
        hover:opacity-80
        transition-opacity duration-200
        ${sizeClasses[size]}
        ${className}
      `}
    >
      NUTRI
    </Link>
  );
}
