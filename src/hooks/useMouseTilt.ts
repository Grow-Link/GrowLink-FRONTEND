import { useRef, useEffect } from 'react';

export function useMouseTilt<T extends HTMLElement>(strength = 10) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    function handleMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      el!.style.setProperty('--tilt-x', `${(-py * strength).toFixed(2)}deg`);
      el!.style.setProperty('--tilt-y', `${(px * strength).toFixed(2)}deg`);
      el!.style.setProperty('--glow-x', `${(px * 0.5 + 0.5) * 100}%`);
      el!.style.setProperty('--glow-y', `${(py * 0.5 + 0.5) * 100}%`);
    }

    function handleLeave() {
      el!.style.setProperty('--tilt-x', '0deg');
      el!.style.setProperty('--tilt-y', '0deg');
    }

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [strength]);

  return ref;
}
