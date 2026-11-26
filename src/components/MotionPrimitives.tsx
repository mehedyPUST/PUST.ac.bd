'use client';

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { motion } from 'motion/react';

const EDITORIAL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function PageReveal({
  routeKey,
  children,
}: {
  routeKey: string;
  children: ReactNode;
}) {
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    hasHydratedRef.current = true;
  }, []);

  return (
    <motion.div
      key={routeKey}
      initial={hasHydratedRef.current ? { opacity: 0.3, y: 4 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: EDITORIAL_EASE }}
      style={{ willChange: 'opacity, transform' }}
      className="flex-1 flex flex-col min-h-[65vh]"
    >
      {children}
    </motion.div>
  );
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
  delay: _delay = 0,
  interactive = true,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
  delay?: number;
  interactive?: boolean;
}) {
  void _delay;
  return (
    <div
      {...rest}
      className={interactive ? `card-hover-lift ${className}` : className}
    >
      {children}
    </div>
  );
}
