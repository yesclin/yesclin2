import { useState, useEffect, useRef, useCallback } from "react";

interface UseAutoSaveOptions {
  /** Interval in seconds between auto-saves (default: 30) */
  intervalSeconds?: number;
  /** Whether auto-save is enabled */
  enabled?: boolean;
  /** Callback to perform the save */
  onSave: () => Promise<void> | void;
}

export function useAutoSave({
  intervalSeconds = 30,
  enabled = true,
  onSave,
}: UseAutoSaveOptions) {
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onSaveRef = useRef(onSave);

  // Keep callback ref updated without re-triggering effect
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const performSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    setHasError(false);
    try {
      await onSaveRef.current();
      setLastSavedAt(new Date());
    } catch (err) {
      console.error("Auto-save failed:", err);
      setHasError(true);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving]);

  // Set up interval
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      performSave();
    }, intervalSeconds * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, intervalSeconds, performSave]);

  // Save on tab change / unmount
  const saveOnLeave = useCallback(() => {
    if (enabled) {
      performSave();
    }
  }, [enabled, performSave]);

  // Save on page visibility change (user switches tab)
  useEffect(() => {
    if (!enabled) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        performSave();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [enabled, performSave]);

  return {
    lastSavedAt,
    isSaving,
    hasError,
    saveNow: performSave,
    saveOnLeave,
  };
}
