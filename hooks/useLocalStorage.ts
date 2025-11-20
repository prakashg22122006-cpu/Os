
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function load<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    // If the item doesn't exist or is the string "undefined", return the fallback.
    if (item === null || item === 'undefined') {
      return fallback;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error reading localStorage key “${key}”:`, error);
    return fallback;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
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
