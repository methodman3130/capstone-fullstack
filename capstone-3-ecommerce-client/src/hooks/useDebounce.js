import { useEffect, useState } from 'react';

/**
 * Delays a value until the user stops changing it.
 *
 * Without this, typing "keyboard" fires eight requests - one per keystroke -
 * and they can arrive out of order, so the results for "keyb" overwrite
 * the results for "keyboard".
 */
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // cancel the pending timer on every keystroke
  }, [value, delay]);

  return debounced;
}
