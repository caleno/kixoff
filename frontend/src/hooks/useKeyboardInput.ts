import { useEffect, useState, useRef } from 'react';

export interface KeyState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  kick: boolean;
}

const defaultKeys: KeyState = {
  up: false, down: false, left: false, right: false, kick: false,
};

export function useKeyboardInput() {
  const [keys, setKeys] = useState<KeyState>(defaultKeys);
  const keysRef = useRef(keys);
  keysRef.current = keys;

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':
          setKeys(k => ({ ...k, up: true })); break;
        case 'KeyS': case 'ArrowDown':
          setKeys(k => ({ ...k, down: true })); break;
        case 'KeyA': case 'ArrowLeft':
          setKeys(k => ({ ...k, left: true })); break;
        case 'KeyD': case 'ArrowRight':
          setKeys(k => ({ ...k, right: true })); break;
        case 'Space':
          setKeys(k => ({ ...k, kick: true })); e.preventDefault(); break;
      }
    };

    const handleUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':
          setKeys(k => ({ ...k, up: false })); break;
        case 'KeyS': case 'ArrowDown':
          setKeys(k => ({ ...k, down: false })); break;
        case 'KeyA': case 'ArrowLeft':
          setKeys(k => ({ ...k, left: false })); break;
        case 'KeyD': case 'ArrowRight':
          setKeys(k => ({ ...k, right: false })); break;
        case 'Space':
          setKeys(k => ({ ...k, kick: false })); break;
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
