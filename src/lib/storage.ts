import { STORAGE_KEY } from './constants';
import { getCurrentMonday } from './date';
import type { AppState } from './types';

const DEFAULT_CHECKLIST_ITEMS = [
  { id: 'c1', label: 'Apply to 10 sponsored roles', checked: false },
  { id: 'c2', label: '1 cold outreach to a Critical Skills sponsor', checked: false },
  { id: 'c3', label: 'Complete 1 TryHackMe SOC room', checked: false },
  { id: 'c4', label: 'Publish or schedule 1 LinkedIn post', checked: false },
  { id: 'c5', label: 'Review and update job tracker', checked: false },
  { id: 'c6', label: 'Log 2+ hours of study time', checked: false },
];

export function createDefaultState(): AppState {
  return {
    _version: 1,
    jobs: [],
    weeklyChecklist: {
      weekStart: getCurrentMonday(),
      items: DEFAULT_CHECKLIST_ITEMS.map((i) => ({ ...i })),
    },
    studyProgress: {},
    studyLog: [],
    readArticles: [],
    readLaterArticles: [],
    blogIdeas: [],
    contacts: [],
    interviewPreps: [],
    starStories: [],
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as AppState;
    const migrated = ensureNewFields(parsed);
    return resetChecklistIfNewWeek(migrated);
  } catch {
    return createDefaultState();
  }
}

function ensureNewFields(state: AppState): AppState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as any;
  return {
    ...state,
    contacts: s.contacts ?? [],
    interviewPreps: s.interviewPreps ?? [],
    starStories: s.starStories ?? [],
  };
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetChecklistIfNewWeek(state: AppState): AppState {
  const currentMonday = getCurrentMonday();
  if (state.weeklyChecklist.weekStart < currentMonday) {
    return {
      ...state,
      weeklyChecklist: {
        weekStart: currentMonday,
        items: DEFAULT_CHECKLIST_ITEMS.map((i) => ({ ...i })),
      },
    };
  }
  return state;
}
