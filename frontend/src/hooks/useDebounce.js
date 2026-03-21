import { useState, useEffect } from "react";

/**
 * Debounces a value by the given delay.
 * @param {any} value - The value to debounce.
 * @param {number} [delay=400] - Debounce delay in milliseconds.
 * @returns {any} The debounced value.
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
