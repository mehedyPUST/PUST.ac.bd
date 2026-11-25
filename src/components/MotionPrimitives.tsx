import type { KeyboardEvent, ReactNode } from 'react';

export function PageReveal({
  children,
}: {
  routeKey: string;
  children: ReactNode;
}) {
  return <div className="flex-1 flex flex-col">{children}</div>;
}

export function MotionReveal({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return <div className={className}>{children}</div>;
}

export function MotionCard({
  children,
  className = '',
  interactive = true,
  onClick,
  onKeyDown,
  role,
  tabIndex,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  interactive?: boolean;
  onClick?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  role?: string;
  tabIndex?: number;
}) {
  return (
    <div
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={role}
      tabIndex={tabIndex}
      className={interactive ? `card-hover-lift ${className}` : className}
    >
      {children}
    </div>
  );
}
