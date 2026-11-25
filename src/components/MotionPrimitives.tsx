import type { HTMLAttributes, ReactNode } from 'react';

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
  delay: _delay,
  interactive = true,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
  delay?: number;
  interactive?: boolean;
}) {
  return (
    <div
      {...rest}
      className={interactive ? `card-hover-lift ${className}` : className}
    >
      {children}
    </div>
  );
}
