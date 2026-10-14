import { useEffect, useState } from 'react';

export interface KeyState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  kick: boolean;
}

const defaultState: KeyState = {
  up: false,
  down: false,
  left: false,
  right: false,
  kick: false,
};

const keyMap: Record<string, keyof KeyState> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
  Space: 'kick',
};

export function useKeyboardInput() {
  const [keys, setKeys] = useState<KeyState>(defaultState);

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      const key = keyMap[e.code];
      if (key) {
        e.preventDefault();
        setKeys((prev) => ({ ...prev, [key]: true }));
      }
    };

    const handleUp = (e: KeyboardEvent) => {
      const key = keyMap[e.code];
      if (key) {
        e.preventDefault();
        setKeys((prev) => ({ ...prev, [key]: false }));
      }
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);

    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  return keys;
}
