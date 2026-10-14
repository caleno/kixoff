import { useEffect, useRef } from 'react';

export function useKeyboardInput(
  onInput: (input: { moveX: number; moveY: number; action: string }) => void
) {
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
      handleAction(e.key.toLowerCase());
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };

    const handleAction = (key: string) => {
      const actions: Record<string, string> = {
        ' ': 'shoot',
        shift: 'pass',
        e: 'tackle',
        q: 'dash',
      };
      if (actions[key]) {
        onInput({ moveX: 0, moveY: 0, action: actions[key] });
      }
    };

    const poll = setInterval(() => {
      let moveX = 0;
      let moveY = 0;
      if (keys.current['w'] || keys.current['arrowup']) moveY -= 1;
      if (keys.current['s'] || keys.current['arrowdown']) moveY += 1;
      if (keys.current['a'] || keys.current['arrowleft']) moveX -= 1;
      if (keys.current['d'] || keys.current['arrowright']) moveX += 1;
      const mag = Math.hypot(moveX, moveY);
      if (mag > 0) {
        moveX /= mag;
        moveY /= mag;
      }
      onInput({ moveX, moveY, action: 'none' });
    }, 16);

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      clearInterval(poll);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [onInput]);
}
