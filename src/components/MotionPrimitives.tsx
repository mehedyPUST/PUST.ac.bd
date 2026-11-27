'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';

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
      className="flex-1 w-full flex flex-col min-h-[65vh]"
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
  delay = 0,
  duration = 0.58,
  distance = 32,
  direction = 'up',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  distance?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const initialOffset =
    direction === 'up'
      ? { y: distance, x: 0 }
      : direction === 'left'
      ? { x: distance, y: 0 }
      : direction === 'right'
      ? { x: -distance, y: 0 }
      : { x: 0, y: 0 };

  return (
    <motion.div
      initial={{ opacity: 0, ...initialOffset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 'some', margin: '0px 0px -24px 0px' }}
      transition={{ duration, delay, ease: EDITORIAL_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionCard({
  children,
  className = '',
  delay = 0,
  interactive = true,
  ...rest
}: HTMLMotionProps<'div'> & {
  children: ReactNode;
  className?: string;
  delay?: number;
  interactive?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const resolvedClass = interactive ? `card-hover-lift ${className}` : className;

  if (reduceMotion) {
    return (
      <motion.div {...rest} className={resolvedClass}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      {...rest}
      initial={{ opacity: 0, y: 24, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 'some', margin: '0px 0px -20px 0px' }}
      transition={{ duration: 0.5, delay, ease: EDITORIAL_EASE }}
      className={resolvedClass}
    >
      {children}
    </motion.div>
  );
}
