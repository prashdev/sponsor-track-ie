import { STORAGE_KEY } from './constants';
import { loadState, saveState, createDefaultState } from './storage';

export function exportData(): void {
  const state = loadState();
  state._exportedAt = new Date().toISOString();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `sponsor-track-ie-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(json: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(json);
    if (parsed._version !== 1) {
      return { success: false, error: `Unsupported data version: ${parsed._version}` };
    }
    saveState(parsed);
    return { success: true };
  } catch {
    return { success: false, error: 'Invalid JSON file.' };
  }
}

export function resetData(): void {
  localStorage.removeItem(STORAGE_KEY);
  saveState(createDefaultState());
}
