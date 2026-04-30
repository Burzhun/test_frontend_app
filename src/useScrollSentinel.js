import { useEffect, useRef } from 'react';

export function useScrollSentinel(onIntersect, enabled, rootRef) {
  const sentinelRef = useRef(null);
  const callbackRef = useRef(onIntersect);
  callbackRef.current = onIntersect;

  useEffect(() => {
    if (!enabled) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) callbackRef.current();
      },
      { root: rootRef?.current ?? null, threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, rootRef]);

  return sentinelRef;
}
