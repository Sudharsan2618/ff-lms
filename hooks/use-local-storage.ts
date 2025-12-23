import { useState, useEffect, useCallback } from 'react';

type SetStateAction<S> = S | ((prevState: S) => S);
type Dispatch<A> = (value: A) => void;

type UseLocalStorageReturnType<T> = [T, (value: SetStateAction<T>) => void];

export function useLocalStorage<T>(
  key: string, 
  initialValue: T
): UseLocalStorageReturnType<T> {
  // Get from local storage then parse stored json or return initialValue
  const readValue = useCallback((): T => {
    // Prevent build error "window is undefined" but keep working
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback((value: SetStateAction<T>) => {
    try {
      setStoredValue(prev => {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(prev) : value;
        const valueToStoreStr = JSON.stringify(valueToStore);
        
        // Only update if the value has changed
        if (JSON.stringify(prev) !== valueToStoreStr) {
          // Save to local storage
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, valueToStoreStr);
          }
          return valueToStore;
        }
        return prev;
      });
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  // Sync with local storage on mount and when key changes
  useEffect(() => {
    setStoredValue(readValue());
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          const newValue = JSON.parse(e.newValue!);
          setStoredValue(prev => {
            // Only update if the value is different
            return JSON.stringify(prev) !== e.newValue ? newValue : prev;
          });
        } catch (error) {
          console.warn(`Error parsing localStorage value for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, readValue]);

  return [storedValue, setValue];
}
