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
      initial={hasHydratedRef.current ? { opacity: 0.84 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.14, ease: EDITORIAL_EASE }}
      className="flex-1 flex flex-col min-h-[65vh]"
    >
      {children}
    </motion.div>
  );
}

export function SubPagePanel({
  subKey,
  children,
  className = '',
}: {
  subKey: string;
  children: ReactNode;
  className?: string;
}) {
  const hasMountedRef = useRef(false);

  useEffect(() => {
    hasMountedRef.current = true;
  }, []);

  return (
    <motion.div
      key={subKey}
      initial={hasMountedRef.current ? { opacity: 0.92 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12, ease: EDITORIAL_EASE }}
      className={className ? `min-w-0 ${className}` : 'min-w-0'}
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
