export interface Job {
  id: string;
  company: string;
  role: string;
  source_url: string;
  sponsor_confirmed: boolean;
  permit_type_target: 'GEP' | 'CSEP' | 'Either' | 'Unknown';
  salary_eur: number | null;
  applied_on: string | null;
  status: 'saved' | 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'ghosted';
  next_action: string;
  next_action_due: string | null;
  notes: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface StudyProgress {
  [resourceId: string]: boolean;
}

export interface StudyLogEntry {
  id: string;
  track: string;
  date: string;
  minutes: number;
}

export interface SavedArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  savedAt: string;
}

export interface BlogIdeaState {
  seedId: string;
  status: 'idea' | 'drafted' | 'published';
  publishedUrl: string;
  hook: string;
}

export interface AppState {
  _version: 1;
  _exportedAt?: string;
  jobs: Job[];
  weeklyChecklist: {
    weekStart: string;
    items: ChecklistItem[];
  };
  studyProgress: StudyProgress;
  studyLog: StudyLogEntry[];
  readArticles: string[];
  readLaterArticles: SavedArticle[];
  blogIdeas: BlogIdeaState[];
}

export interface Sponsor {
  name: string;
  website: string;
  careers_url: string;
  sectors: string[];
  permit_types: string[];
  dublin_office: boolean;
  notes: string;
  source_verified_on: string;
}

export interface Resource {
  id: string;
  track: string;
  title: string;
  url: string;
  type: string;
  level: string;
  free: boolean;
  notes: string;
}

export interface NewsSource {
  name: string;
  url: string;
  topic: string;
  lang: string;
}

export interface BlogSeed {
  id: string;
  theme: string;
  prompt: string;
  angle: string;
  est_read_time: string;
}

export interface PermitInfo {
  gep_threshold: number;
  csep_threshold: number;
  critical_skills_note: string;
  links: { label: string; url: string }[];
  last_updated: string;
}
