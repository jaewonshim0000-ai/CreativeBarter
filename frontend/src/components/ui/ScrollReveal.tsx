'use client';

import { useEffect } from 'react';

/**
 * Global IntersectionObserver that watches for elements with
 * reveal classes and adds 'visible' when they scroll into view.
 * 
 * Just add any of these classes to an element:
 *   .reveal         — fade up
 *   .reveal-left    — slide from left
 *   .reveal-right   — slide from right
 *   .reveal-scale   — scale up
 *   .reveal-stagger — children animate one by one
 */
export function ScrollRevealProvider() {
  useEffect(() => {
    const selectors = '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger';

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );

    // Observe all current reveal elements
    document.querySelectorAll(selectors).forEach((el) => observer.observe(el));

    // Watch for dynamically added elements (React renders, page navigations)
    const mutationObserver = new MutationObserver(() => {
      document.querySelectorAll(selectors).forEach((el) => {
        if (!el.classList.contains('visible')) {
          observer.observe(el);
        }
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}
