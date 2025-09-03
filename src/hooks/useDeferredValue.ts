import { useState, useEffect } from 'react';

export function useDeferredValue<T>(value: T, delay: number = 300): T {
  const [deferredValue, setDeferredValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDeferredValue(value);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return deferredValue;
}
