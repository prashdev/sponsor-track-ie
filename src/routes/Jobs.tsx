import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Plus, LayoutGrid, List, ExternalLink, Pencil, Trash2,
  AlertTriangle, Search, Rss, RefreshCw, Briefcase,
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

function useJobicyJobs(tag: string) {
  const [jobs, setJobs] = useState<JobicyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`https://jobicy.com/api/v2/remote-jobs?tag=${encodeURIComponent(tag)}&count=20`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { if (!cancelled) { setJobs(d.jobs ?? []); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [tag]);

  return { jobs, loading, error };
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

// ─── Main Route ───────────────────────────────────────────────────────────────

export default function Jobs() {
  const [state, setState] = useAppState();
  const [tab, setTab] = useState<'tracker' | 'live'>('tracker');
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
      <div className="mt-4 flex border-b border-zinc-200">
        {(['tracker', 'live'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}>
            {t === 'tracker' ? 'My Tracker' : '🔍 Find Jobs'}
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
      ) : (
        <div className="mt-4">
          <LiveJobs onAddToTracker={(j) => {
            setEditJob({ company: j.companyName, role: j.jobTitle, source_url: j.url });
            setTab('tracker');
          }} />
        </div>
      )}

      {editJob !== null && (
        <JobForm initial={editJob} onSave={saveJob} onCancel={() => setEditJob(null)} />
      )}
    </div>
  );
}
