'use client';

import { useEffect, useRef, ReactNode } from 'react';

type RevealType = 'up' | 'left' | 'right' | 'scale' | 'stagger';

interface RevealProps {
  children: ReactNode;
  type?: RevealType;
  delay?: number;       // extra delay in ms
  className?: string;   // additional classes
  threshold?: number;   // 0-1, how much must be visible
}

const typeClassMap: Record<RevealType, string> = {
  up: 'reveal',
  left: 'reveal-left',
  right: 'reveal-right',
  scale: 'reveal-scale',
  stagger: 'reveal-stagger',
};

/**
 * Wraps children in a scroll-triggered animation.
 *
 * Usage:
 *   <Reveal>                          — fades up on scroll
 *   <Reveal type="left">              — slides from left
 *   <Reveal type="stagger">           — children animate one by one
 *   <Reveal type="scale" delay={200}> — scales in with 200ms extra delay
 */
export function Reveal({
  children,
  type = 'up',
  delay = 0,
  className = '',
  threshold = 0.15,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Add delay if specified
          if (delay > 0) {
            setTimeout(() => el.classList.add('visible'), delay);
          } else {
            el.classList.add('visible');
          }
          observer.unobserve(el); // Only animate once
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold]);

  return (
    <div ref={ref} className={`${typeClassMap[type]} ${className}`}>
      {children}
    </div>
  );
}
