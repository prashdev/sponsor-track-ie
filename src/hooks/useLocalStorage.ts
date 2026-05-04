import { useState, useEffect, useCallback } from 'react';
import { loadState, saveState } from '../lib/storage';
import type { AppState } from '../lib/types';

export function useAppState(): [AppState, (updater: (prev: AppState) => AppState) => void] {
  const [state, setStateInternal] = useState<AppState>(loadState);

  useEffect(() => {
    const handler = () => setStateInternal(loadState());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const setState = useCallback((updater: (prev: AppState) => AppState) => {
    setStateInternal((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  return [state, setState];
}
