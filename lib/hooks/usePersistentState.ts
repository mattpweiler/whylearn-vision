import { useEffect, useRef, useState } from "react";

/**
 * Small helper hook that keeps a piece of state in sync with localStorage.
 * - Reads once on mount (client-side only)
 * - Writes whenever the state changes
 * - Falls back to the provided default if parsing fails
 */
export function usePersistentState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const defaultRef = useRef(defaultValue);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        setValue(defaultRef.current);
        return;
      }
      const parsed = JSON.parse(raw) as T;
      setValue(parsed);
    } catch {
      setValue(defaultRef.current);
    }
    hasHydratedRef.current = true;
  }, [key]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasHydratedRef.current) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Swallow errors so UI keeps working even if storage is blocked.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
