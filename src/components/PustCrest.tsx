'use client';

interface PustCrestProps {
  size?: number;
  variant?: 'emerald' | 'light';
  className?: string;
}

export function PustCrest({ size = 40, variant = 'emerald', className = '' }: PustCrestProps) {
  const stroke = variant === 'emerald' ? '#064E3B' : '#FFFFFF';
  const fillBg = variant === 'emerald' ? '#ECFDF5' : '#065F46';
  const accent = variant === 'emerald' ? '#B45309' : '#FDE68A';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="PUST Official Institutional Crest"
      className={className}
    >
      <circle cx="32" cy="32" r="29" fill={fillBg} stroke={stroke} strokeWidth="2.4" />
      <circle
        cx="32"
        cy="32"
        r="24"
        stroke={stroke}
        strokeWidth="1"
        strokeDasharray="2.5 2.5"
        opacity="0.55"
      />
      {/* Architectural Pediment & Columns */}
      <path
        d="M17 26L32 16L47 26H17Z"
        fill={stroke}
        fillOpacity="0.12"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <line x1="22" y1="26" x2="22" y2="41" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="26" x2="32" y2="41" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <line x1="42" y1="26" x2="42" y2="41" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      {/* Open Scholarly Book Base */}
      <path
        d="M17 44C21.5 41.5 27 41.5 32 44C37 41.5 42.5 41.5 47 44"
        stroke={accent}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M21 48H43"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Star of Inquiry */}
      <circle cx="32" cy="11.5" r="2" fill={accent} />
    </svg>
  );
}
