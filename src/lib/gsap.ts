'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function animateStagger(
  scope: HTMLElement | null,
  selector: string,
  options?: {
    y?: number;
    duration?: number;
    stagger?: number;
    opacityFrom?: number;
    delay?: number;
  }
): () => void {
  if (!scope || prefersReducedMotion()) {
    return () => undefined;
  }

  const targets = scope.querySelectorAll(selector);
  if (targets.length === 0) {
    return () => undefined;
  }

  const ctx = gsap.context(() => {
    gsap.fromTo(
      targets,
      {
        y: options?.y ?? 10,
        opacity: options?.opacityFrom ?? 0.35,
      },
      {
        y: 0,
        opacity: 1,
        duration: options?.duration ?? 0.32,
        stagger: options?.stagger ?? 0.04,
        delay: options?.delay ?? 0,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
        overwrite: 'auto',
      }
    );
  }, scope);

  return () => ctx.revert();
}
