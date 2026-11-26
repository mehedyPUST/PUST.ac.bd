'use client';

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { gsap, prefersReducedMotion } from '../lib/gsap';

export function PageReveal({
  routeKey,
  children,
}: {
  routeKey: string;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstRenderRef = useRef(true);

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    const el = containerRef.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0.72, y: 8 },
        {
          opacity: 1,
          y: 0,
          duration: 0.28,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
          overwrite: 'auto',
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [routeKey]);

  return (
    <div ref={containerRef} className="flex-1 flex flex-col">
      {children}
    </div>
  );
}

export function MotionReveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from(el, {
        y: 16,
        opacity: 0.25,
        duration: 0.5,
        delay: Math.min(delay, 0.25),
        ease: 'power3.out',
        immediateRender: false,
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          once: true,
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function MotionCard({
  children,
  className = '',
  delay = 0,
  interactive = true,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
  delay?: number;
  interactive?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from(el, {
        y: 12,
        opacity: 0.35,
        duration: 0.4,
        delay: Math.min(delay, 0.22),
        ease: 'power2.out',
        immediateRender: false,
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: el,
          start: 'top 94%',
          once: true,
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [delay]);

  return (
    <div
      ref={ref}
      {...rest}
      className={interactive ? `card-hover-lift ${className}` : className}
    >
      {children}
    </div>
  );
}
