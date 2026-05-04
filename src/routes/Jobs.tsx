import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus, LayoutGrid, List, ExternalLink, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useAppState } from '../hooks/useLocalStorage';
import type { Job } from '../lib/types';

const STATUSES: Job['status'][] = [
  'saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'ghosted',
];

const STATUS_LABELS: Record<Job['status'], string> = {
  saved: 'Saved',
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  ghosted: 'Ghosted',
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

const GEP_MIN = 36605;
const CSEP_MIN = 40904;

function salaryWarning(job: Job): string | null {
  if (!job.salary_eur || !job.sponsor_confirmed) return null;
  if (job.salary_eur < GEP_MIN) return `€${job.salary_eur.toLocaleString()} is below GEP minimum (€${GEP_MIN.toLocaleString()}). Role cannot be sponsored.`;
  if (job.salary_eur < CSEP_MIN) return `€${job.salary_eur.toLocaleString()} qualifies for GEP only (€${CSEP_MIN.toLocaleString()}+ required for CSEP).`;
  return null;
}

function StatusBadge({ status }: { status: Job['status'] }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

const EMPTY_JOB: Omit<Job, 'id'> = {
  company: '',
  role: '',
  source_url: '',
  sponsor_confirmed: false,
  permit_type_target: 'Unknown',
  salary_eur: null,
  applied_on: null,
  status: 'saved',
  next_action: '',
  next_action_due: null,
  notes: '',
};

function JobForm({
  initial,
  onSave,
  onCancel,
}: {
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-20">
      <div className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-zinc-900">
          {initial.id ? 'Edit Job' : 'Add Job'}
        </h2>

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
            <input
              className="input"
              type="number"
              placeholder="e.g. 55000"
              value={form.salary_eur ?? ''}
              onChange={(e) => set('salary_eur', e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div>
            <label className="label">Applied On</label>
            <input
              className="input"
              type="date"
              value={form.applied_on ?? ''}
              onChange={(e) => set('applied_on', e.target.value || null)}
            />
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
            <input
              type="checkbox"
              id="sponsor_confirmed"
              checked={form.sponsor_confirmed}
              onChange={(e) => set('sponsor_confirmed', e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-800"
            />
            <label htmlFor="sponsor_confirmed" className="text-sm text-zinc-700">Sponsor confirmed</label>
          </div>
        </div>

        {warning && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            {warning}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button
            onClick={() => {
              if (!form.company || !form.role) return;
              onSave(form);
            }}
            className="btn-primary"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function TableView({ jobs, onEdit, onDelete }: { jobs: Job[]; onEdit: (j: Job) => void; onDelete: (id: string) => void }) {
  const [sortKey, setSortKey] = useState<keyof Job>('applied_on');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  function toggleSort(k: keyof Job) {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setSortDir('desc'); }
  }

  const sorted = [...jobs].sort((a, b) => {
    const av = a[sortKey] ?? '';
    const bv = b[sortKey] ?? '';
    return sortDir === 'asc'
      ? av < bv ? -1 : av > bv ? 1 : 0
      : av > bv ? -1 : av < bv ? 1 : 0;
  });

  function Th({ label, k }: { label: string; k: keyof Job }) {
    return (
      <th
        className="cursor-pointer select-none px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-800"
        onClick={() => toggleSort(k)}
      >
        {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </th>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500">
        No jobs yet. Add one above.
      </div>
    );
  }

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
                    {job.sponsor_confirmed && (
                      <span className="rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-bold text-emerald-700">✓</span>
                    )}
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
                    <button onClick={() => onEdit(job)} className="text-zinc-400 hover:text-zinc-700">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => onDelete(job.id)} className="text-zinc-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
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

function KanbanView({ jobs, onEdit, onDelete }: { jobs: Job[]; onEdit: (j: Job) => void; onDelete: (id: string) => void }) {
  const columns = STATUSES.map((s) => ({
    status: s,
    jobs: jobs.filter((j) => j.status === s),
  }));

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {columns.map(({ status, jobs: colJobs }) => (
        <div key={status} className="w-52 shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {STATUS_LABELS[status]}
            </span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
              {colJobs.length}
            </span>
          </div>
          <div className="space-y-2">
            {colJobs.map((job) => {
              const warn = salaryWarning(job);
              return (
                <div
                  key={job.id}
                  className="rounded-lg border border-zinc-200 bg-white p-3 text-sm shadow-sm"
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <p className="font-medium text-zinc-900">{job.company}</p>
                      <p className="text-xs text-zinc-500">{job.role}</p>
                    </div>
                    {job.sponsor_confirmed && (
                      <span className="shrink-0 rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-bold text-emerald-700">✓</span>
                    )}
                  </div>
                  {job.salary_eur && (
                    <p className="mt-1.5 text-xs tabular-nums text-zinc-500">
                      €{job.salary_eur.toLocaleString()}
                    </p>
                  )}
                  {warn && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600">
                      <AlertTriangle size={10} /> Salary warning
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => onEdit(job)} className="text-zinc-400 hover:text-zinc-700">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => onDelete(job.id)} className="text-zinc-400 hover:text-red-500">
                      <Trash2 size={12} />
                    </button>
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
              <div className="rounded-lg border border-dashed border-zinc-200 px-3 py-4 text-center text-xs text-zinc-400">
                Empty
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Jobs() {
  const [state, setState] = useAppState();
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
        <button onClick={() => setEditJob({})} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Job
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-zinc-200 bg-white">
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 rounded-l-lg px-3 py-1.5 text-sm ${view === 'table' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50'}`}
          >
            <List size={14} /> Table
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`flex items-center gap-1.5 rounded-r-lg px-3 py-1.5 text-sm ${view === 'kanban' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50'}`}
          >
            <LayoutGrid size={14} /> Kanban
          </button>
        </div>

        <select
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as Job['status'] | 'all')}
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>

        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={sponsorOnly}
            onChange={(e) => setSponsorOnly(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 accent-zinc-800"
          />
          Sponsor-confirmed only
        </label>
      </div>

      <div className="mt-4">
        {view === 'table' ? (
          <TableView jobs={filtered} onEdit={setEditJob} onDelete={deleteJob} />
        ) : (
          <KanbanView jobs={filtered} onEdit={setEditJob} onDelete={deleteJob} />
        )}
      </div>

      {editJob !== null && (
        <JobForm
          initial={editJob}
          onSave={saveJob}
          onCancel={() => setEditJob(null)}
        />
      )}
    </div>
  );
}
