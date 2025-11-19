
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function load<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    // If the item doesn't exist or is the string "undefined" or "null", return the fallback.
    if (item === null || item === 'undefined' || item === 'null') {
      return fallback;
    }
    try {
        const parsed = JSON.parse(item);
        // Extra safety: if parsing returns null (valid JSON for null), but we expect non-null fallback, handle it.
        if (parsed === null && fallback !== null) {
            return fallback;
        }
        return parsed;
    } catch (e) {
        // If JSON parse fails, return fallback instead of crashing
        console.warn(`Error parsing localStorage key “${key}”:`, e);
        return fallback;
    }
  } catch (error) {
    console.warn(`Error reading localStorage key “${key}”:`, error);
    return fallback;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  // Use a lazy initializer to ensure load() only runs once on mount
  const [storedValue, setStoredValue] = useState<T>(() => load(key, initialValue));

  useEffect(() => {
    try {
      // Prevent storing the string "undefined" if the state becomes undefined.
      if (storedValue === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(storedValue));
      }
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
