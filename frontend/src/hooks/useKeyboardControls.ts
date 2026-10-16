import { useEffect, useState, useRef } from 'react';

/**
 * useKeyboardControls — WASD + Space input
 * Aura (UI) — KIXoff
 */

interface Controls {
  dx: number;
  dy: number;
  kick: boolean;
}

export function useKeyboardControls() {
  const [controls, setControls] = useState<Controls>({ dx: 0, dy: 0, kick: false });
  const keysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', ' '].includes(key)) {
        e.preventDefault();
        keysRef.current.add(key);
        updateControls();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.delete(key);
      updateControls();
    };

    const updateControls = () => {
      const keys = keysRef.current;
      const dx = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0);
      const dy = (keys.has('s') ? 1 : 0) - (keys.has('w') ? 1 : 0);
      const kick = keys.has(' ');
      setControls({ dx, dy, kick });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return controls;
}
