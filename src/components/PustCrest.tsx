'use client';

import Image from 'next/image';
import pustLogo from '../../public/assets/pust-logo.png';

interface PustCrestProps {
  size?: number;
  variant?: 'emerald' | 'primary' | 'light';
  className?: string;
}

export function PustCrest({
  size = 40,
  variant = 'primary',
  className = '',
}: PustCrestProps) {
  const height = size;
  const width = Math.max(16, Math.round(size * (1772 / 2126)));

  if (variant === 'light') {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-xl bg-white p-1 shadow-xs ring-1 ring-white/20 shrink-0 ${className}`}
      >
        <Image
          src={pustLogo}
          alt="Pabna University of Science and Technology Official Logo"
          width={width}
          height={height}
          referrerPolicy="no-referrer"
          className="object-contain"
          style={{ width, height }}
        />
      </span>
    );
  }

  return (
    <Image
      src={pustLogo}
      alt="Pabna University of Science and Technology Official Logo"
      width={width}
      height={height}
      referrerPolicy="no-referrer"
      className={`object-contain shrink-0 ${className}`}
      style={{ width, height }}
    />
  );
}
