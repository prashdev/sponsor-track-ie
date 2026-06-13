import { useState, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Plus, LayoutGrid, List, ExternalLink, Pencil, Trash2,
  AlertTriangle, Search, Rss, RefreshCw, Briefcase, Globe, MapPin, Sparkles,
} from 'lucide-react';
import { useAppState } from '../hooks/useLocalStorage';
import { useStaticData } from '../hooks/useStaticData';
import { useRssFeed } from '../hooks/useRssFeed';
import type { Job } from '../lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobBoard {
  id: string;
  role_type: string;
  role_label: string;
  board: string;
  url: string;
  notes: string;
  icon: string;
}

interface JobFeed {
  id: string;
  name: string;
  url: string;
  description: string;
  role_types: string[];
}

interface JobicyJob {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  jobType: string[];
  jobGeo: string;
  jobLevel: string;
  jobExcerpt: string;
  pubDate: string;
}

function useJobicyJobs(tag: string, geo?: string) {
  const [jobs, setJobs] = useState<JobicyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const geoParam = geo ? `&geo=${encodeURIComponent(geo)}` : '';
    fetch(`https://jobicy.com/api/v2/remote-jobs?tag=${encodeURIComponent(tag)}&count=20${geoParam}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { if (!cancelled) { setJobs(d.jobs ?? []); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [tag, geo]);

  return { jobs, loading, error };
}

// ─── Aggregated multi-source job types/hooks ──────────────────────────────────

interface UnifiedJob {
  source: 'Jobicy' | 'Remotive' | 'Arbeitnow' | 'TheMuse';
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  postedAt: string;     // ISO
  excerpt: string;
  tags: string[];
}

function useRemotiveJobs(category: string) {
  const [jobs, setJobs] = useState<UnifiedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`https://remotive.com/api/remote-jobs?category=${encodeURIComponent(category)}&limit=30`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d: any) => {
        if (cancelled) return;
        const list: UnifiedJob[] = (d.jobs ?? []).map((j: any) => ({
          source: 'Remotive', id: `rmt-${j.id}`, title: j.title, company: j.company_name,
          location: j.candidate_required_location || 'Remote', url: j.url,
          postedAt: j.publication_date ?? '',
          excerpt: (j.description ?? '').replace(/<[^>]+>/g, '').slice(0, 240),
          tags: j.tags ?? [],
        }));
        setJobs(list); setLoading(false);
      })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [category]);
  return { jobs, loading, error };
}

function useArbeitnowJobs() {
  const [jobs, setJobs] = useState<UnifiedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('https://www.arbeitnow.com/api/job-board-api')
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d: any) => {
        if (cancelled) return;
        const list: UnifiedJob[] = (d.data ?? []).slice(0, 50).map((j: any) => ({
          source: 'Arbeitnow', id: `arb-${j.slug}`, title: j.title, company: j.company_name,
          location: j.location || (j.remote ? 'Remote' : ''), url: j.url,
          postedAt: j.created_at ? new Date(j.created_at * 1000).toISOString() : '',
          excerpt: (j.description ?? '').replace(/<[^>]+>/g, '').slice(0, 240),
          tags: j.tags ?? [],
        }));
        setJobs(list); setLoading(false);
      })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);
  return { jobs, loading, error };
}

function useTheMuseJobs(category: string) {
  const [jobs, setJobs] = useState<UnifiedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`https://www.themuse.com/api/public/jobs?category=${encodeURIComponent(category)}&page=1`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d: any) => {
        if (cancelled) return;
        const list: UnifiedJob[] = (d.results ?? []).map((j: any) => ({
          source: 'TheMuse', id: `muse-${j.id}`, title: j.name, company: j.company?.name ?? '',
          location: (j.locations?.[0]?.name) ?? 'Remote',
          url: j.refs?.landing_page ?? '', postedAt: j.publication_date ?? '',
          excerpt: (j.contents ?? '').replace(/<[^>]+>/g, '').slice(0, 240),
          tags: (j.categories ?? []).map((c: any) => c.name),
        }));
        setJobs(list); setLoading(false);
      })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [category]);
  return { jobs, loading, error };
}

function jobicyToUnified(j: JobicyJob): UnifiedJob {
  return {
    source: 'Jobicy', id: `joby-${j.id}`, title: j.jobTitle, company: j.companyName,
    location: j.jobGeo || 'Remote', url: j.url, postedAt: j.pubDate ?? '',
    excerpt: (j.jobExcerpt ?? '').replace(/<[^>]+>/g, '').slice(0, 240),
    tags: j.jobType ?? [],
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES: Job['status'][] = [
  'saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'ghosted',
];

const STATUS_LABELS: Record<Job['status'], string> = {
  saved: 'Saved', applied: 'Applied', screening: 'Screening',
  interview: 'Interview', offer: 'Offer', rejected: 'Rejected', ghosted: 'Ghosted',
};

const STATUS_COLORS: Record<Job['status'], string> = {
  saved: 'bg-zinc-100 text-zinc-600',
  applied: 'bg-blue-50 text-blue-700',
  screening: 'bg-yellow-50 text-yellow-700',
  interview: 'bg-purple-50 text-purple-700',
  offer: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-600',
  ghosted: 'bg-zinc-100 text-zinc-400',
};

const ROLE_TYPE_LABELS: Record<string, string> = {
  appsec: 'AppSec',
  pentest: 'Pentest',
  'ai-security': 'AI Security',
  soc: 'SOC Analyst',
  infosec: 'InfoSec',
  grc: 'GRC / DORA',
  sponsored: 'Visa Sponsorship',
};

const GEP_MIN = 36605;
const CSEP_MIN = 40904;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function salaryWarning(job: Job): string | null {
  if (!job.salary_eur || !job.sponsor_confirmed) return null;
  if (job.salary_eur < GEP_MIN)
    return `€${job.salary_eur.toLocaleString()} is below GEP minimum (€${GEP_MIN.toLocaleString()}). Cannot be sponsored.`;
  if (job.salary_eur < CSEP_MIN)
    return `€${job.salary_eur.toLocaleString()} qualifies for GEP only (€${CSEP_MIN.toLocaleString()}+ needed for CSEP).`;
  return null;
}

function StatusBadge({ status }: { status: Job['status'] }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── Job Form ─────────────────────────────────────────────────────────────────

const EMPTY_JOB: Omit<Job, 'id'> = {
  company: '', role: '', source_url: '', sponsor_confirmed: false,
  permit_type_target: 'Unknown', salary_eur: null, applied_on: null,
  status: 'saved', next_action: '', next_action_due: null, notes: '',
};

function JobForm({ initial, onSave, onCancel }: {
  initial: Partial<Job>;
  onSave: (job: Omit<Job, 'id'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<Job, 'id'>>({ ...EMPTY_JOB, ...initial });
  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }
  const warning = salaryWarning({ ...form, id: '' });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-16">
      <div className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-zinc-900">{initial.id ? 'Edit Job' : 'Add Job'}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Company</label>
            <input className="input" value={form.company} onChange={(e) => set('company', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Role</label>
            <input className="input" value={form.role} onChange={(e) => set('role', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Job URL</label>
            <input className="input" type="url" value={form.source_url} onChange={(e) => set('source_url', e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value as Job['status'])}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Permit Target</label>
            <select className="input" value={form.permit_type_target} onChange={(e) => set('permit_type_target', e.target.value as Job['permit_type_target'])}>
              {(['CSEP', 'GEP', 'Either', 'Unknown'] as const).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Salary (EUR)</label>
            <input className="input" type="number" placeholder="e.g. 55000"
              value={form.salary_eur ?? ''}
              onChange={(e) => set('salary_eur', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="label">Applied On</label>
            <input className="input" type="date" value={form.applied_on ?? ''}
              onChange={(e) => set('applied_on', e.target.value || null)} />
          </div>
          <div className="col-span-2">
            <label className="label">Next Action</label>
            <input className="input" value={form.next_action} onChange={(e) => set('next_action', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Notes</label>
            <textarea className="input min-h-[60px] resize-none" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="sponsor_confirmed" checked={form.sponsor_confirmed}
              onChange={(e) => set('sponsor_confirmed', e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-800" />
            <label htmlFor="sponsor_confirmed" className="text-sm text-zinc-700">Sponsor confirmed</label>
          </div>
        </div>
        {warning && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {warning}
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={() => { if (!form.company || !form.role) return; onSave(form); }} className="btn-primary">Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Table View ───────────────────────────────────────────────────────────────

function TableView({ jobs, onEdit, onDelete }: { jobs: Job[]; onEdit: (j: Job) => void; onDelete: (id: string) => void }) {
  const [sortKey, setSortKey] = useState<keyof Job>('applied_on');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  function toggleSort(k: keyof Job) {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setSortDir('desc'); }
  }

  const sorted = [...jobs].sort((a, b) => {
    const av = a[sortKey] ?? ''; const bv = b[sortKey] ?? '';
    return sortDir === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
  });

  function Th({ label, k }: { label: string; k: keyof Job }) {
    return (
      <th className="cursor-pointer select-none px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-800"
        onClick={() => toggleSort(k)}>
        {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </th>
    );
  }

  if (sorted.length === 0) return (
    <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500">
      No jobs yet. Add one above, or browse Live Jobs to find roles.
    </div>
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200">
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50">
          <tr>
            <Th label="Company" k="company" />
            <Th label="Role" k="role" />
            <Th label="Status" k="status" />
            <Th label="Salary" k="salary_eur" />
            <Th label="Applied" k="applied_on" />
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {sorted.map((job) => {
            const warn = salaryWarning(job);
            return (
              <tr key={job.id} className="bg-white hover:bg-zinc-50">
                <td className="px-3 py-2.5 font-medium text-zinc-900">
                  <div className="flex items-center gap-1.5">
                    {job.company}
                    {job.sponsor_confirmed && <span className="rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-bold text-emerald-700">✓</span>}
                    {warn && <AlertTriangle size={13} className="text-amber-500" />}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-zinc-700">
                  <div className="flex items-center gap-1">
                    {job.role}
                    {job.source_url && (
                      <a href={job.source_url} target="_blank" rel="noreferrer">
                        <ExternalLink size={12} className="text-zinc-400 hover:text-zinc-700" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5"><StatusBadge status={job.status} /></td>
                <td className="px-3 py-2.5 tabular-nums text-zinc-600">
                  {job.salary_eur ? `€${job.salary_eur.toLocaleString()}` : '—'}
                </td>
                <td className="px-3 py-2.5 tabular-nums text-zinc-500">
                  {job.applied_on ? format(parseISO(job.applied_on), 'dd MMM yyyy') : '—'}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onEdit(job)} className="text-zinc-400 hover:text-zinc-700"><Pencil size={14} /></button>
                    <button onClick={() => onDelete(job.id)} className="text-zinc-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Kanban View ──────────────────────────────────────────────────────────────

function KanbanView({ jobs, onEdit, onDelete }: { jobs: Job[]; onEdit: (j: Job) => void; onDelete: (id: string) => void }) {
  const columns = STATUSES.map((s) => ({ status: s, jobs: jobs.filter((j) => j.status === s) }));
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {columns.map(({ status, jobs: colJobs }) => (
        <div key={status} className="w-52 shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{STATUS_LABELS[status]}</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">{colJobs.length}</span>
          </div>
          <div className="space-y-2">
            {colJobs.map((job) => {
              const warn = salaryWarning(job);
              return (
                <div key={job.id} className="rounded-lg border border-zinc-200 bg-white p-3 text-sm shadow-sm">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <p className="font-medium text-zinc-900">{job.company}</p>
                      <p className="text-xs text-zinc-500">{job.role}</p>
                    </div>
                    {job.sponsor_confirmed && <span className="shrink-0 rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-bold text-emerald-700">✓</span>}
                  </div>
                  {job.salary_eur && <p className="mt-1.5 text-xs tabular-nums text-zinc-500">€{job.salary_eur.toLocaleString()}</p>}
                  {warn && <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600"><AlertTriangle size={10} /> Salary warning</p>}
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => onEdit(job)} className="text-zinc-400 hover:text-zinc-700"><Pencil size={12} /></button>
                    <button onClick={() => onDelete(job.id)} className="text-zinc-400 hover:text-red-500"><Trash2 size={12} /></button>
                    {job.source_url && (
                      <a href={job.source_url} target="_blank" rel="noreferrer">
                        <ExternalLink size={12} className="text-zinc-400 hover:text-zinc-700" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
            {colJobs.length === 0 && (
              <div className="rounded-lg border border-dashed border-zinc-200 px-3 py-4 text-center text-xs text-zinc-400">Empty</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Live Jobs ────────────────────────────────────────────────────────────────

function BoardIcon({ icon }: { icon: string }) {
  const cls = 'w-5 h-5 shrink-0 rounded';
  const map: Record<string, string> = {
    linkedin: '🔵', indeed: '🔍', irishjobs: '🍀', glassdoor: '🟢',
    reed: '🟠', remotive: '🌍', gov: '🏛️', external: '🔗',
  };
  return <span className={cls + ' flex items-center justify-center text-sm'}>{map[icon] ?? '🔗'}</span>;
}

function LiveJobsRssFeed({ feed }: { feed: JobFeed }) {
  const { items, loading, error } = useRssFeed(feed.url);

  if (loading) return <div className="px-4 py-3 text-xs text-zinc-400">Loading {feed.name}…</div>;
  if (error) return <div className="px-4 py-3 text-xs text-red-400">Failed: {error}</div>;
  if (!items.length) return <div className="px-4 py-3 text-xs text-zinc-400">No items found.</div>;

  return (
    <div className="divide-y divide-zinc-100">
      {items.slice(0, 8).map((item) => (
        <div key={item.link} className="px-4 py-3 hover:bg-zinc-50">
          <a href={item.link} target="_blank" rel="noreferrer"
            className="flex items-start gap-1.5 text-sm font-medium text-zinc-900 hover:underline">
            {item.title}
            <ExternalLink size={11} className="mt-0.5 shrink-0 text-zinc-400" />
          </a>
          <p className="mt-0.5 text-xs text-zinc-500">
            {item.author ? `${item.author} · ` : ''}
            {item.pubDate?.slice(0, 10) ?? ''}
          </p>
        </div>
      ))}
    </div>
  );
}

const JOBICY_TAGS = [
  { tag: 'security', label: 'Security' },
  { tag: 'cybersecurity', label: 'Cybersecurity' },
  { tag: 'devops', label: 'DevOps / DevSecOps' },
  { tag: 'compliance', label: 'Compliance / GRC' },
];

function LiveApiJobs({ onAddToTracker }: { onAddToTracker: (j: JobicyJob) => void }) {
  const [activeTag, setActiveTag] = useState('security');
  const { jobs, loading, error } = useJobicyJobs(activeTag);

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          <Briefcase size={12} className="inline" /> Live Remote Jobs — Jobicy API
        </h3>
        <span className="text-xs text-zinc-400">Updates on page load · no login required</span>
      </div>

      <div className="mb-3 flex gap-1.5">
        {JOBICY_TAGS.map(({ tag, label }) => (
          <button key={tag} onClick={() => setActiveTag(tag)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeTag === tag ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-8 text-sm text-zinc-400">
          <RefreshCw size={14} className="animate-spin" /> Fetching live jobs…
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load: {error}
        </div>
      )}
      {!loading && !error && jobs.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-400">
          No jobs found for "{activeTag}" right now. Try another category.
        </div>
      )}
      {!loading && jobs.length > 0 && (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div key={job.id}
              className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-300 hover:shadow-sm transition-all">
              {job.companyLogo ? (
                <img src={job.companyLogo} alt={job.companyName}
                  className="h-9 w-9 shrink-0 rounded-md border border-zinc-100 object-contain bg-white p-0.5"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-100 bg-zinc-50 text-lg">🏢</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <a href={job.url} target="_blank" rel="noreferrer"
                      className="text-sm font-semibold text-zinc-900 hover:underline">
                      {job.jobTitle}
                    </a>
                    <p className="text-xs text-zinc-500 mt-0.5">{job.companyName} · {job.jobGeo}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => onAddToTracker(job)}
                      title="Add to My Tracker"
                      className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors">
                      <Plus size={11} /> Track
                    </button>
                    <a href={job.url} target="_blank" rel="noreferrer"
                      className="text-zinc-400 hover:text-zinc-700">
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {job.jobType?.map((t) => (
                    <span key={t} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">{t}</span>
                  ))}
                  {job.jobLevel && (
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">{job.jobLevel}</span>
                  )}
                  <span className="text-[10px] text-zinc-400">{job.pubDate?.slice(0, 10)}</span>
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2">{job.jobExcerpt}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-zinc-400">
        Source: Jobicy.com public API. Remote roles globally — many open to Ireland-based candidates.
        Click "Track" to save a role to My Tracker.
      </p>
    </div>
  );
}

function LiveJobs({ onAddToTracker }: { onAddToTracker: (j: JobicyJob) => void }) {
  const { data: boards } = useStaticData<JobBoard[]>('data/job-boards.json');
  const { data: feeds } = useStaticData<JobFeed[]>('data/job-feeds.json');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeFeed, setActiveFeed] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');

  const roleTypes = Array.from(new Set((boards ?? []).map((b) => b.role_type)));

  const filteredBoards = (boards ?? []).filter((b) => {
    if (roleFilter !== 'all' && b.role_type !== roleFilter) return false;
    if (searchQ && !b.board.toLowerCase().includes(searchQ.toLowerCase()) &&
      !b.role_label.toLowerCase().includes(searchQ.toLowerCase()) &&
      !b.notes.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  const grouped = roleTypes.reduce<Record<string, JobBoard[]>>((acc, t) => {
    const items = filteredBoards.filter((b) => b.role_type === t);
    if (items.length) acc[t] = items;
    return acc;
  }, {});

  return (
    <div className="max-w-4xl">
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700">
        <strong>How this works:</strong> Each link opens a pre-filtered job search on that board in a new tab.
        Results are live and updated by the job board. For sponsored roles, always confirm sponsorship directly with the recruiter.
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input className="rounded-lg border border-zinc-200 bg-white pl-7 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
            placeholder="Search boards…" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setRoleFilter('all')}
            className={`rounded-full px-3 py-1 text-xs font-medium ${roleFilter === 'all' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
            All roles
          </button>
          {roleTypes.map((t) => (
            <button key={t} onClick={() => setRoleFilter(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${roleFilter === t ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
              {ROLE_TYPE_LABELS[t] ?? t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([type, bds]) => (
          <div key={type}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              {ROLE_TYPE_LABELS[type] ?? type}
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {bds.map((b) => (
                <a key={b.id} href={b.url} target="_blank" rel="noreferrer"
                  className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-400 hover:shadow-sm transition-all">
                  <BoardIcon icon={b.icon} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">{b.board}</p>
                    <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{b.notes}</p>
                  </div>
                  <ExternalLink size={14} className="mt-0.5 shrink-0 text-zinc-400" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <LiveApiJobs onAddToTracker={onAddToTracker} />

      {feeds && feeds.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            <Rss size={12} className="inline mr-1" />Live RSS Job Feeds
          </h3>
          <div className="space-y-3">
            {feeds.map((feed) => (
              <div key={feed.id} className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
                <button
                  onClick={() => setActiveFeed(activeFeed === feed.id ? null : feed.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-50"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{feed.name}</p>
                    <p className="text-xs text-zinc-500">{feed.description}</p>
                  </div>
                  <RefreshCw size={14} className={`text-zinc-400 transition-transform ${activeFeed === feed.id ? 'rotate-180' : ''}`} />
                </button>
                {activeFeed === feed.id && (
                  <div className="border-t border-zinc-100">
                    <LiveJobsRssFeed feed={feed} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            RSS feeds pull remote-friendly roles globally. Most are open to Ireland-based candidates.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Daily Feed (Multi-source aggregator) ─────────────────────────────────────

interface HiddenBoard {
  name: string;
  url: string;
  notes: string;
}

const HIDDEN_BOARDS: HiddenBoard[] = [
  { name: 'Hiring Cafe', url: 'https://hiring.cafe/?searchState=%7B%22searchQuery%22%3A%22cybersecurity%22%7D', notes: 'Curated startup roles, often missed by aggregators. Filter by keyword and location.' },
  { name: 'Trueup.io', url: 'https://www.trueup.io/jobs?role_l1=Security', notes: 'Tech-startup focused. Strong filters for role family, stage, and location.' },
  { name: 'Otta (Welcome to the Jungle)', url: 'https://otta.com/jobs/security', notes: 'Modern tech startups across EU. Good for AppSec and Product Security roles.' },
  { name: 'Wellfound (AngelList)', url: 'https://wellfound.com/role/security-engineer', notes: 'Startup-heavy. Equity-first compensation. Some sponsor visas.' },
  { name: 'Built In', url: 'https://builtin.com/jobs/dev-engineering/search/security', notes: 'Tech-company aggregator. US-heavy but expanding into EU.' },
  { name: 'Y Combinator Work List', url: 'https://www.ycombinator.com/jobs/role/security-engineer', notes: 'YC portfolio companies hiring. Often early-career-friendly roles.' },
  { name: 'Welcome to the Jungle', url: 'https://www.welcometothejungle.com/en/jobs?query=cybersecurity', notes: 'EU-focused company-profile-rich job board. Strong on culture data.' },
  { name: 'Layoffs.fyi (rebound)', url: 'https://layoffs.fyi/', notes: 'Track who is hiring vs cutting. Useful signal on company stability before applying.' },
  { name: 'Key Values', url: 'https://www.keyvalues.com/?filter%5B0%5D=security', notes: 'Filter companies by engineering values. Smaller but high-signal.' },
  { name: 'Tech Jobs for Good', url: 'https://techjobsforgood.com/jobs/?keywords=security', notes: 'Mission-driven tech roles. Smaller pool but distinctive employers.' },
];

function DailyFeed({ onAddToTracker }: { onAddToTracker: (u: UnifiedJob) => void }) {
  const [sourceFilter, setSourceFilter] = useState<Record<UnifiedJob['source'], boolean>>({
    Jobicy: true, Remotive: true, Arbeitnow: true, TheMuse: true,
  });
  const [search, setSearch] = useState('');

  const jobicy = useJobicyJobs('security');
  const remotive = useRemotiveJobs('software-dev');
  const arbeitnow = useArbeitnowJobs();
  const muse = useTheMuseJobs('Cybersecurity & Information Security');

  const merged = useMemo(() => {
    const all: UnifiedJob[] = [
      ...(sourceFilter.Jobicy ? jobicy.jobs.map(jobicyToUnified) : []),
      ...(sourceFilter.Remotive ? remotive.jobs : []),
      ...(sourceFilter.Arbeitnow ? arbeitnow.jobs : []),
      ...(sourceFilter.TheMuse ? muse.jobs : []),
    ];
    const seen = new Set<string>();
    const deduped = all.filter((j) => {
      if (!j.url) return false;
      if (seen.has(j.url)) return false;
      seen.add(j.url);
      return true;
    });
    deduped.sort((a, b) => (b.postedAt || '').localeCompare(a.postedAt || ''));
    if (search.trim()) {
      const q = search.toLowerCase();
      return deduped.filter((j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return deduped;
  }, [jobicy.jobs, remotive.jobs, arbeitnow.jobs, muse.jobs, sourceFilter, search]);

  const anyLoading = jobicy.loading || remotive.loading || arbeitnow.loading || muse.loading;

  const sourceColors: Record<UnifiedJob['source'], string> = {
    Jobicy: 'bg-blue-50 text-blue-700',
    Remotive: 'bg-emerald-50 text-emerald-700',
    Arbeitnow: 'bg-purple-50 text-purple-700',
    TheMuse: 'bg-rose-50 text-rose-700',
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
        <strong>How this works:</strong> Live aggregation of 4 free job APIs (Jobicy, Remotive, Arbeitnow, The Muse) refreshed every page load.
        Deduplicated by URL, sorted newest first. Hidden / underrated boards below the live feed.
      </div>

      {/* Source toggles + search */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            className="rounded-lg border border-zinc-200 bg-white pl-7 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 w-52"
            placeholder="Filter title/company/tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(sourceFilter) as UnifiedJob['source'][]).map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter((prev) => ({ ...prev, [s]: !prev[s] }))}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                sourceFilter[s] ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-zinc-400">
          {anyLoading ? 'Loading…' : `${merged.length} live jobs`}
        </span>
      </div>

      {/* Errors */}
      {[jobicy, remotive, arbeitnow, muse].some((s) => s.error) && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Some sources failed to load: {jobicy.error && 'Jobicy '} {remotive.error && 'Remotive '} {arbeitnow.error && 'Arbeitnow '} {muse.error && 'TheMuse'}
          — others still shown.
        </div>
      )}

      {/* Live job list */}
      {anyLoading && merged.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-8 text-sm text-zinc-400">
          <RefreshCw size={14} className="animate-spin" /> Fetching live jobs from 4 sources…
        </div>
      ) : merged.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-400">
          No jobs match these filters.
        </div>
      ) : (
        <div className="space-y-2">
          {merged.slice(0, 80).map((job) => (
            <div key={job.id}
              className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-300 hover:shadow-sm transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <a href={job.url} target="_blank" rel="noreferrer"
                      className="text-sm font-semibold text-zinc-900 hover:underline">
                      {job.title}
                    </a>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {job.company} · {job.location}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => onAddToTracker(job)}
                      className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors">
                      <Plus size={11} /> Track
                    </button>
                    <a href={job.url} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-zinc-700">
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sourceColors[job.source]}`}>
                    {job.source}
                  </span>
                  {job.tags.slice(0, 4).map((t) => (
                    <span key={t} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">{t}</span>
                  ))}
                  {job.postedAt && <span className="text-[10px] text-zinc-400">{job.postedAt.slice(0, 10)}</span>}
                </div>
                {job.excerpt && (
                  <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2">{job.excerpt}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden / underrated boards */}
      <div className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={13} className="text-zinc-500" />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Hidden / Underrated Boards
          </h3>
        </div>
        <p className="mb-3 text-xs text-zinc-400">
          Curated job sites that miss the standard aggregators. Each opens pre-filtered for security where possible.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {HIDDEN_BOARDS.map((b) => (
            <a key={b.name} href={b.url} target="_blank" rel="noreferrer"
              className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-400 hover:shadow-sm transition-all">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900">{b.name}</p>
                <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{b.notes}</p>
              </div>
              <ExternalLink size={14} className="mt-0.5 shrink-0 text-zinc-400" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Ireland Jobs ─────────────────────────────────────────────────────────────

interface IrishBoard {
  id: string;
  name: string;
  category: 'general' | 'tech' | 'agency' | 'government';
  url: string;
  filter_applied: string;
  notes: string;
  sponsor_friendly: boolean;
}

const IRISH_CATEGORY_LABELS: Record<IrishBoard['category'], string> = {
  general: 'General Boards',
  tech: 'Tech-Specific',
  agency: 'Recruitment Agencies',
  government: 'Government / Public Sector',
};

function IrelandJobs({ onAddToTracker }: { onAddToTracker: (u: UnifiedJob) => void }) {
  const jobicyIE = useJobicyJobs('security', 'ireland');
  const { data: boards } = useStaticData<IrishBoard[]>('data/irish-job-boards.json');

  const grouped = (boards ?? []).reduce<Record<IrishBoard['category'], IrishBoard[]>>(
    (acc, b) => { (acc[b.category] = acc[b.category] || []).push(b); return acc; },
    { general: [], tech: [], agency: [], government: [] }
  );

  return (
    <div className="max-w-4xl">
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
        <strong>Ireland-only:</strong> Live Jobicy roles filtered to Ireland geo, plus 20 curated Irish job boards
        (general, tech-specific, recruitment agencies, public sector). Always cross-check sponsorship on the
        {' '}<a href="https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/trusted-partner-initiative/" target="_blank" rel="noreferrer" className="underline">DETE Trusted Partner list</a>.
      </div>

      {/* Live Jobicy Ireland */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            <Briefcase size={12} /> Live — Jobicy (Ireland)
          </h3>
          <span className="text-xs text-zinc-400">Refreshes on page load</span>
        </div>
        {jobicyIE.loading && (
          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-400">
            <RefreshCw size={14} className="animate-spin" /> Loading Ireland-geo jobs…
          </div>
        )}
        {jobicyIE.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">Failed: {jobicyIE.error}</div>
        )}
        {!jobicyIE.loading && jobicyIE.jobs.length === 0 && !jobicyIE.error && (
          <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-400">
            No Ireland-geo security roles in Jobicy right now. Try the curated boards below.
          </div>
        )}
        {jobicyIE.jobs.length > 0 && (
          <div className="space-y-2">
            {jobicyIE.jobs.map((job) => (
              <div key={job.id}
                className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-300 hover:shadow-sm transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <a href={job.url} target="_blank" rel="noreferrer"
                        className="text-sm font-semibold text-zinc-900 hover:underline">{job.jobTitle}</a>
                      <p className="text-xs text-zinc-500 mt-0.5">{job.companyName} · {job.jobGeo}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => onAddToTracker(jobicyToUnified(job))}
                        className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 hover:border-zinc-400">
                        <Plus size={11} /> Track
                      </button>
                      <a href={job.url} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-zinc-700">
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2">{job.jobExcerpt}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Curated Irish boards by category */}
      <div className="space-y-6">
        {(Object.keys(grouped) as IrishBoard['category'][]).map((cat) => (
          grouped[cat].length > 0 && (
            <div key={cat}>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                <MapPin size={11} /> {IRISH_CATEGORY_LABELS[cat]} <span className="text-zinc-400 font-normal">({grouped[cat].length})</span>
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {grouped[cat].map((b) => (
                  <a key={b.id} href={b.url} target="_blank" rel="noreferrer"
                    className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-400 hover:shadow-sm transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-zinc-900">{b.name}</p>
                        {b.sponsor_friendly && (
                          <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700">sponsor-aware</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[10px] text-zinc-400">Filter: {b.filter_applied}</p>
                      <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{b.notes}</p>
                    </div>
                    <ExternalLink size={14} className="mt-0.5 shrink-0 text-zinc-400" />
                  </a>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

// ─── Germany Jobs ─────────────────────────────────────────────────────────────

interface GermanBoard {
  id: string;
  name: string;
  category: 'english-friendly' | 'general' | 'specialist' | 'agency' | 'government';
  url: string;
  filter_applied: string;
  notes: string;
  english_only: boolean;
  sponsor_friendly: boolean;
}

const GERMAN_CATEGORY_LABELS: Record<GermanBoard['category'], string> = {
  'english-friendly': 'English-First Boards (zero noise)',
  general: 'Major German Boards (filter for English)',
  specialist: 'Tech / Specialist Boards',
  agency: 'Recruitment Agencies (DACH)',
  government: 'Government / Official Portals',
};

const GERMAN_ROLE_QUERIES = [
  { tag: 'security engineer', label: 'Security Engineer' },
  { tag: 'penetration tester', label: 'Penetration Tester' },
  { tag: 'information security analyst', label: 'InfoSec Analyst' },
  { tag: 'soc analyst', label: 'SOC Analyst' },
  { tag: 'red team', label: 'Red Team' },
];

function GermanyJobs({ onAddToTracker }: { onAddToTracker: (u: UnifiedJob) => void }) {
  const [activeRole, setActiveRole] = useState('security engineer');
  const jobicyDE = useJobicyJobs(activeRole, 'germany');
  const arbeitnow = useArbeitnowJobs();
  const muse = useTheMuseJobs('Cybersecurity & Information Security');
  const { data: boards } = useStaticData<GermanBoard[]>('data/german-job-boards.json');

  // Filter Arbeitnow + Muse to Germany + matching role keyword
  const filteredArbeitnow = arbeitnow.jobs.filter((j) => {
    const loc = (j.location || '').toLowerCase();
    const isGermany = loc.includes('german') || loc.includes('berlin') || loc.includes('munich') ||
      loc.includes('münchen') || loc.includes('hamburg') || loc.includes('frankfurt') ||
      loc.includes('cologne') || loc.includes('köln') || loc.includes('düsseldorf') ||
      loc.includes('stuttgart') || j.tags.some((t) => t.toLowerCase().includes('german'));
    const matchesRole = j.title.toLowerCase().includes(activeRole.split(' ')[0]) ||
      j.tags.some((t) => t.toLowerCase().includes('security') || t.toLowerCase().includes('cyber'));
    return isGermany && matchesRole;
  });

  const filteredMuse = muse.jobs.filter((j) => {
    const loc = (j.location || '').toLowerCase();
    return loc.includes('german') || loc.includes('berlin') || loc.includes('munich') || loc.includes('frankfurt');
  });

  const grouped = (boards ?? []).reduce<Record<GermanBoard['category'], GermanBoard[]>>(
    (acc, b) => { (acc[b.category] = acc[b.category] || []).push(b); return acc; },
    { 'english-friendly': [], general: [], specialist: [], agency: [], government: [] }
  );

  const totalLive = jobicyDE.jobs.length + filteredArbeitnow.length + filteredMuse.length;

  return (
    <div className="max-w-4xl">
      <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs text-yellow-900">
        <strong>Germany — English-speaking cybersecurity roles only.</strong> Live aggregation across Jobicy (geo=germany) + Arbeitnow (DE-focused) + The Muse (Germany filter),
        plus 29 curated boards. Targeted at: Information Security Analyst, Penetration Tester, Security Engineer, SOC Analyst, Red Team — entry to associate level.
        For visa-sponsorship clarity: prefer <strong>Make-it-in-Germany</strong> and <strong>English-first boards</strong> below.
      </div>

      {/* Role tag selector for live API */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">Live API — Role Focus</p>
        <div className="flex flex-wrap gap-1.5">
          {GERMAN_ROLE_QUERIES.map(({ tag, label }) => (
            <button key={tag} onClick={() => setActiveRole(tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeRole === tag ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Jobicy DE */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            <Briefcase size={12} /> Live — Germany ({totalLive} matched)
          </h3>
          <span className="text-xs text-zinc-400">Refreshes on page load</span>
        </div>
        {jobicyDE.loading && (
          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-400">
            <RefreshCw size={14} className="animate-spin" /> Loading…
          </div>
        )}
        {!jobicyDE.loading && totalLive === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-400">
            No live Germany-geo roles matching "{activeRole}" right now. Try the curated boards below — they cover the gaps.
          </div>
        )}
        {totalLive > 0 && (
          <div className="space-y-2">
            {jobicyDE.jobs.map((job) => (
              <div key={job.id}
                className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-300 hover:shadow-sm transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <a href={job.url} target="_blank" rel="noreferrer"
                        className="text-sm font-semibold text-zinc-900 hover:underline">{job.jobTitle}</a>
                      <p className="text-xs text-zinc-500 mt-0.5">{job.companyName} · {job.jobGeo}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">Jobicy</span>
                      <button
                        onClick={() => onAddToTracker(jobicyToUnified(job))}
                        className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 hover:border-zinc-400">
                        <Plus size={11} /> Track
                      </button>
                      <a href={job.url} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-zinc-700">
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2">{job.jobExcerpt}</p>
                </div>
              </div>
            ))}
            {filteredArbeitnow.slice(0, 10).map((job) => (
              <div key={job.id}
                className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-300 hover:shadow-sm transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <a href={job.url} target="_blank" rel="noreferrer"
                        className="text-sm font-semibold text-zinc-900 hover:underline">{job.title}</a>
                      <p className="text-xs text-zinc-500 mt-0.5">{job.company} · {job.location}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700">Arbeitnow</span>
                      <button
                        onClick={() => onAddToTracker(job)}
                        className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 hover:border-zinc-400">
                        <Plus size={11} /> Track
                      </button>
                      <a href={job.url} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-zinc-700">
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                  {job.excerpt && <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2">{job.excerpt}</p>}
                </div>
              </div>
            ))}
            {filteredMuse.map((job) => (
              <div key={job.id}
                className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-300 hover:shadow-sm transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <a href={job.url} target="_blank" rel="noreferrer"
                        className="text-sm font-semibold text-zinc-900 hover:underline">{job.title}</a>
                      <p className="text-xs text-zinc-500 mt-0.5">{job.company} · {job.location}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700">TheMuse</span>
                      <button
                        onClick={() => onAddToTracker(job)}
                        className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 hover:border-zinc-400">
                        <Plus size={11} /> Track
                      </button>
                      <a href={job.url} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-zinc-700">
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Curated German boards by category */}
      <div className="space-y-6">
        {(Object.keys(grouped) as GermanBoard['category'][]).map((cat) => (
          grouped[cat].length > 0 && (
            <div key={cat}>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                <MapPin size={11} /> {GERMAN_CATEGORY_LABELS[cat]} <span className="text-zinc-400 font-normal">({grouped[cat].length})</span>
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {grouped[cat].map((b) => (
                  <a key={b.id} href={b.url} target="_blank" rel="noreferrer"
                    className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-400 hover:shadow-sm transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-medium text-zinc-900">{b.name}</p>
                        {b.english_only && (
                          <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700">English-only</span>
                        )}
                        {b.sponsor_friendly && (
                          <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700">sponsor-aware</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[10px] text-zinc-400">Filter: {b.filter_applied}</p>
                      <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{b.notes}</p>
                    </div>
                    <ExternalLink size={14} className="mt-0.5 shrink-0 text-zinc-400" />
                  </a>
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      <p className="mt-6 text-xs text-zinc-400">
        Visa note: Germany's <strong>Blue Card</strong> requires €45,300+ for shortage occupations (IT/cybersecurity qualifies) or €48,300+ general for 2025.
        Verify each role's salary against the threshold. The <em>Chancenkarte</em> (Opportunity Card) also opens a path for skilled migrants from non-EU countries.
      </p>
    </div>
  );
}

// ─── Germany Sponsored (curated companies) ────────────────────────────────────

interface GermanSponsor {
  id: string;
  company: string;
  locations: string[];
  english_workplace: boolean;
  sponsor_confidence: 'high' | 'medium' | 'low';
  roles_hiring: string[];
  careers_url: string;
  notes: string;
  level_fit: string;
  salary_band: string;
}

const SPONSOR_CONFIDENCE_STYLES: Record<GermanSponsor['sponsor_confidence'], string> = {
  high: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-red-100 text-red-600',
};
const SPONSOR_CONFIDENCE_LABELS: Record<GermanSponsor['sponsor_confidence'], string> = {
  high: 'Sponsors regularly',
  medium: 'Has sponsored — verify',
  low: 'Unconfirmed',
};

function GermanSponsored() {
  const { data: sponsors, loading, error } = useStaticData<GermanSponsor[]>('data/german-sponsors.json');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [englishOnly, setEnglishOnly] = useState(true);
  const [confFilter, setConfFilter] = useState<'all' | 'high'>('all');

  const allRoles = Array.from(new Set((sponsors ?? []).flatMap((s) => s.roles_hiring))).sort();

  const filtered = (sponsors ?? []).filter((s) => {
    if (englishOnly && !s.english_workplace) return false;
    if (confFilter === 'high' && s.sponsor_confidence !== 'high') return false;
    if (roleFilter !== 'all' && !s.roles_hiring.some((r) => r.toLowerCase().includes(roleFilter.toLowerCase()))) return false;
    return true;
  });

  const highCount = (sponsors ?? []).filter((s) => s.sponsor_confidence === 'high').length;

  return (
    <div className="max-w-4xl">
      <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
        <strong>Germany — Visa-sponsoring companies, English workplace, entry/associate level only.</strong>
        Curated list of {sponsors?.length ?? 0} employers known to sponsor Blue Card for cybersecurity roles.
        Roles in focus: Information Security Analyst, Penetration Tester, Security Engineer, SOC Analyst, Red Team.
        Apply directly via the careers link — recruiters move faster than agency-routed candidates here.
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        >
          <option value="all">All target roles</option>
          {allRoles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        <div className="flex gap-1.5">
          {(['all', 'high'] as const).map((v) => (
            <button key={v} onClick={() => setConfFilter(v)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                confFilter === v ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}>
              {v === 'all' ? 'All confidence' : `High only (${highCount})`}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={englishOnly}
            onChange={(e) => setEnglishOnly(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 accent-zinc-800"
          />
          English workplace only
        </label>

        <span className="ml-auto text-xs text-zinc-400">{filtered.length} companies</span>
      </div>

      {loading && <p className="text-sm text-zinc-400">Loading…</p>}
      {error && <p className="text-sm text-red-500">Failed to load: {error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((s) => (
            <div key={s.id} className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-5 hover:border-zinc-300 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{s.company}</p>
                  <p className="text-xs text-zinc-500">{s.locations.join(' · ')}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${SPONSOR_CONFIDENCE_STYLES[s.sponsor_confidence]}`}>
                  {SPONSOR_CONFIDENCE_LABELS[s.sponsor_confidence]}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {s.english_workplace && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">English workplace</span>
                )}
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                  {s.level_fit}
                </span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] tabular-nums text-zinc-600">
                  {s.salary_band}
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                {s.roles_hiring.map((r) => (
                  <span key={r} className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600">{r}</span>
                ))}
              </div>

              <p className="text-xs text-zinc-500 leading-relaxed">{s.notes}</p>

              <a
                href={s.careers_url}
                target="_blank"
                rel="noreferrer"
                className="mt-auto flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-zinc-900"
              >
                Open careers page <ExternalLink size={11} />
              </a>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-2 rounded-lg border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500">
              No companies match these filters. Widen the role filter or untick "English workplace only" to see more.
            </div>
          )}
        </div>
      )}

      <p className="mt-5 text-xs text-zinc-400">
        Visa note: Germany's <strong>EU Blue Card</strong> requires €45,300+ for IT/cybersecurity shortage occupations (2025).
        All entry salary bands above meet this threshold. Cross-check the actual offer before signing.
        Companies marked "Has sponsored — verify" have sponsored in the past but it's not a default — confirm with the recruiter on the first call.
      </p>
    </div>
  );
}

// ─── Main Route ───────────────────────────────────────────────────────────────

export default function Jobs() {
  const [state, setState] = useAppState();
  const [tab, setTab] = useState<'tracker' | 'live' | 'daily' | 'ireland' | 'germany' | 'germany-sponsored'>('tracker');
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [filterStatus, setFilterStatus] = useState<Job['status'] | 'all'>('all');
  const [sponsorOnly, setSponsorOnly] = useState(false);
  const [editJob, setEditJob] = useState<Partial<Job> | null>(null);

  const { jobs } = state;

  const filtered = jobs.filter((j) => {
    if (filterStatus !== 'all' && j.status !== filterStatus) return false;
    if (sponsorOnly && !j.sponsor_confirmed) return false;
    return true;
  });

  function saveJob(data: Omit<Job, 'id'>) {
    setState((prev) => {
      const existing = editJob?.id ? prev.jobs.find((j) => j.id === editJob.id) : null;
      if (existing) {
        return { ...prev, jobs: prev.jobs.map((j) => j.id === existing.id ? { ...data, id: j.id } : j) };
      }
      return { ...prev, jobs: [...prev.jobs, { ...data, id: `j-${Date.now()}` }] };
    });
    setEditJob(null);
  }

  function deleteJob(id: string) {
    if (!confirm('Delete this job?')) return;
    setState((prev) => ({ ...prev, jobs: prev.jobs.filter((j) => j.id !== id) }));
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Jobs</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {jobs.length} tracked &mdash; {jobs.filter((j) => j.sponsor_confirmed).length} sponsor-confirmed
          </p>
        </div>
        {tab === 'tracker' && (
          <button onClick={() => setEditJob({})} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Job
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="mt-4 flex flex-wrap border-b border-zinc-200">
        {([
          { id: 'tracker', label: 'My Tracker', icon: null },
          { id: 'live', label: 'Find Jobs', icon: <Search size={13} className="inline mr-1" /> },
          { id: 'daily', label: 'Daily Feed', icon: <Globe size={13} className="inline mr-1" /> },
          { id: 'ireland', label: 'Ireland Jobs', icon: <MapPin size={13} className="inline mr-1" /> },
          { id: 'germany', label: 'Germany Jobs', icon: <MapPin size={13} className="inline mr-1" /> },
          { id: 'germany-sponsored', label: 'Germany Sponsored', icon: <Sparkles size={13} className="inline mr-1" /> },
        ] as const).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'tracker' ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-zinc-200 bg-white">
              <button onClick={() => setView('table')}
                className={`flex items-center gap-1.5 rounded-l-lg px-3 py-1.5 text-sm ${view === 'table' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50'}`}>
                <List size={14} /> Table
              </button>
              <button onClick={() => setView('kanban')}
                className={`flex items-center gap-1.5 rounded-r-lg px-3 py-1.5 text-sm ${view === 'kanban' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50'}`}>
                <LayoutGrid size={14} /> Kanban
              </button>
            </div>

            <select className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700"
              value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as Job['status'] | 'all')}>
              <option value="all">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>

            <label className="flex items-center gap-2 text-sm text-zinc-600">
              <input type="checkbox" checked={sponsorOnly} onChange={(e) => setSponsorOnly(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 accent-zinc-800" />
              Sponsor-confirmed only
            </label>
          </div>

          <div className="mt-4">
            {view === 'table'
              ? <TableView jobs={filtered} onEdit={setEditJob} onDelete={deleteJob} />
              : <KanbanView jobs={filtered} onEdit={setEditJob} onDelete={deleteJob} />}
          </div>
        </>
      ) : tab === 'live' ? (
        <div className="mt-4">
          <LiveJobs onAddToTracker={(j) => {
            setEditJob({ company: j.companyName, role: j.jobTitle, source_url: j.url });
            setTab('tracker');
          }} />
        </div>
      ) : tab === 'daily' ? (
        <div className="mt-4">
          <DailyFeed onAddToTracker={(j) => {
            setEditJob({ company: j.company, role: j.title, source_url: j.url });
            setTab('tracker');
          }} />
        </div>
      ) : tab === 'ireland' ? (
        <div className="mt-4">
          <IrelandJobs onAddToTracker={(j) => {
            setEditJob({ company: j.company, role: j.title, source_url: j.url });
            setTab('tracker');
          }} />
        </div>
      ) : tab === 'germany' ? (
        <div className="mt-4">
          <GermanyJobs onAddToTracker={(j) => {
            setEditJob({ company: j.company, role: j.title, source_url: j.url });
            setTab('tracker');
          }} />
        </div>
      ) : (
        <div className="mt-4">
          <GermanSponsored />
        </div>
      )}

      {editJob !== null && (
        <JobForm initial={editJob} onSave={saveJob} onCancel={() => setEditJob(null)} />
      )}
    </div>
  );
}
