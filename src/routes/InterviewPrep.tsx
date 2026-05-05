import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus, Pencil, Trash2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppState } from '../hooks/useLocalStorage';
import type { InterviewPrep, InterviewRound, StarStory } from '../lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROUND_OPTIONS = [
  'Phone Screen', 'Technical', 'System Design', 'Coding Test',
  'HR / Culture', 'Case Study', 'Panel', 'Reference Check',
];

const COMPETENCIES = [
  'Technical', 'Communication', 'Leadership', 'Conflict',
  'Ownership', 'Debugging', 'Security', 'Collaboration', 'Initiative', 'Adaptability',
];

const OUTCOME_STYLES: Record<InterviewRound['outcome'], string> = {
  pending: 'bg-zinc-100 text-zinc-500',
  passed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-600',
};

// ─── Round Item ───────────────────────────────────────────────────────────────

function RoundItem({
  round,
  onUpdate,
  onDelete,
}: {
  round: InterviewRound;
  onUpdate: (r: InterviewRound) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  function cycleOutcome() {
    const opts: InterviewRound['outcome'][] = ['pending', 'passed', 'failed'];
    onUpdate({ ...round, outcome: opts[(opts.indexOf(round.outcome) + 1) % opts.length] });
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={cycleOutcome}
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${OUTCOME_STYLES[round.outcome]}`}>
          {round.outcome}
        </button>
        <span className="flex-1 text-sm font-medium text-zinc-800">{round.label}</span>
        {round.date && (
          <span className="text-xs text-zinc-400">{format(parseISO(round.date), 'dd MMM')}</span>
        )}
        <button onClick={() => setOpen((v) => !v)} className="text-zinc-400 hover:text-zinc-600">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button onClick={onDelete} className="text-zinc-300 hover:text-red-500">
          <Trash2 size={13} />
        </button>
      </div>
      {open && (
        <div className="space-y-2 border-t border-zinc-100 px-4 py-3">
          <input
            type="date"
            className="input text-xs"
            value={round.date ?? ''}
            onChange={(e) => onUpdate({ ...round, date: e.target.value || null })}
          />
          <textarea
            className="input min-h-[80px] resize-none text-xs"
            placeholder="Notes from this round…"
            value={round.notes}
            onChange={(e) => onUpdate({ ...round, notes: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

// ─── Company Prep Panel ───────────────────────────────────────────────────────

function CompanyPrepPanel({
  jobLabel,
  prep,
  onUpdate,
}: {
  jobLabel: string;
  prep: InterviewPrep;
  onUpdate: (p: InterviewPrep) => void;
}) {
  const [open, setOpen] = useState(false);
  const [addingRound, setAddingRound] = useState(false);
  const [newRoundLabel, setNewRoundLabel] = useState(ROUND_OPTIONS[0]);

  const passedCount = prep.rounds.filter((r) => r.outcome === 'passed').length;

  function addRound() {
    const round: InterviewRound = {
      id: `r-${Date.now()}`,
      label: newRoundLabel,
      date: null,
      notes: '',
      outcome: 'pending',
    };
    onUpdate({ ...prep, rounds: [...prep.rounds, round] });
    setAddingRound(false);
  }

  function updateRound(id: string, r: InterviewRound) {
    onUpdate({ ...prep, rounds: prep.rounds.map((x) => (x.id === id ? r : x)) });
  }

  function deleteRound(id: string) {
    onUpdate({ ...prep, rounds: prep.rounds.filter((x) => x.id !== id) });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-zinc-50"
      >
        <div>
          <p className="text-sm font-semibold text-zinc-900">{jobLabel}</p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {prep.rounds.length} round{prep.rounds.length !== 1 ? 's' : ''} · {passedCount} passed
            {prep.company_research ? ' · research notes saved' : ''}
          </p>
        </div>
        {open ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
      </button>

      {open && (
        <div className="space-y-4 border-t border-zinc-100 px-5 py-4">
          <div>
            <label className="label">Company Research Notes</label>
            <textarea
              className="input min-h-[90px] resize-none text-sm"
              placeholder="Recent news, products, culture, hiring manager background, why you want to work here…"
              value={prep.company_research}
              onChange={(e) => onUpdate({ ...prep, company_research: e.target.value })}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="label mb-0">Interview Rounds</label>
              <button
                onClick={() => setAddingRound((v) => !v)}
                className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900"
              >
                <Plus size={12} /> Add Round
              </button>
            </div>

            {addingRound && (
              <div className="mb-2 flex gap-2">
                <select
                  className="input flex-1 text-xs"
                  value={newRoundLabel}
                  onChange={(e) => setNewRoundLabel(e.target.value)}
                >
                  {ROUND_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <button onClick={addRound} className="btn-primary px-3 text-xs">Add</button>
                <button onClick={() => setAddingRound(false)} className="btn-secondary px-3 text-xs">Cancel</button>
              </div>
            )}

            <div className="space-y-2">
              {prep.rounds.map((r) => (
                <RoundItem
                  key={r.id}
                  round={r}
                  onUpdate={(r2) => updateRound(r.id, r2)}
                  onDelete={() => deleteRound(r.id)}
                />
              ))}
              {prep.rounds.length === 0 && (
                <p className="py-2 text-xs text-zinc-400">No rounds yet. Add your first one above.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STAR Story Card ──────────────────────────────────────────────────────────

function StarCard({
  story,
  onEdit,
  onDelete,
}: {
  story: StarStory;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function copyStory() {
    const text = `**${story.title}**\n\nSituation: ${story.situation}\n\nTask: ${story.task}\n\nAction: ${story.action}\n\nResult: ${story.result}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-900">{story.title}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          <button onClick={copyStory} title="Copy formatted story" className="text-zinc-400 hover:text-zinc-700">
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          </button>
          <button onClick={onEdit} className="text-zinc-400 hover:text-zinc-700"><Pencil size={14} /></button>
          <button onClick={onDelete} className="text-zinc-400 hover:text-red-500"><Trash2 size={14} /></button>
        </div>
      </div>
      {story.competencies.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {story.competencies.map((c) => (
            <span key={c} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">{c}</span>
          ))}
        </div>
      )}
      {story.situation && (
        <p className="mt-2 line-clamp-2 text-xs text-zinc-500">{story.situation}</p>
      )}
    </div>
  );
}

// ─── STAR Story Form ──────────────────────────────────────────────────────────

const EMPTY_STORY: Omit<StarStory, 'id'> = {
  title: '',
  competencies: [],
  situation: '',
  task: '',
  action: '',
  result: '',
};

function StarForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<StarStory>;
  onSave: (s: Omit<StarStory, 'id'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<StarStory, 'id'>>({ ...EMPTY_STORY, ...initial });
  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }
  function toggleComp(c: string) {
    setForm((p) => ({
      ...p,
      competencies: p.competencies.includes(c)
        ? p.competencies.filter((x) => x !== c)
        : [...p.competencies, c],
    }));
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40">
      <div className="flex min-h-full items-start justify-center p-4 pt-10">
        <div className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-zinc-900">
            {initial.id ? 'Edit STAR Story' : 'Add STAR Story'}
          </h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="label">Title</label>
              <input className="input" placeholder="e.g. Found critical XSS in production API"
                value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div>
              <label className="label">Competencies</label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {COMPETENCIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleComp(c)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                      form.competencies.includes(c)
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {(['situation', 'task', 'action', 'result'] as const).map((field) => (
              <div key={field}>
                <label className="label capitalize">{field}</label>
                <textarea
                  className="input min-h-[70px] resize-none text-sm"
                  placeholder={
                    field === 'situation' ? 'Set the context…'
                    : field === 'task' ? 'What was your responsibility?'
                    : field === 'action' ? 'What did you specifically do?'
                    : 'What was the measurable outcome?'
                  }
                  value={form[field]}
                  onChange={(e) => set(field, e.target.value)}
                />
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={onCancel} className="btn-secondary">Cancel</button>
            <button
              onClick={() => { if (!form.title) return; onSave(form); }}
              className="btn-primary">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Route ───────────────────────────────────────────────────────────────

export default function InterviewPrepPage() {
  const [state, setState] = useAppState();
  const [tab, setTab] = useState<'companies' | 'stories'>('companies');
  const [compFilter, setCompFilter] = useState('all');
  const [editStory, setEditStory] = useState<Partial<StarStory> | null>(null);

  const interviewPreps = state.interviewPreps ?? [];
  const starStories = state.starStories ?? [];
  const activeJobs = state.jobs.filter((j) =>
    ['screening', 'interview', 'offer'].includes(j.status)
  );

  function getPrep(jobId: string): InterviewPrep {
    return (
      interviewPreps.find((p) => p.jobId === jobId) ?? {
        jobId,
        rounds: [],
        company_research: '',
      }
    );
  }

  function updatePrep(prep: InterviewPrep) {
    setState((prev) => {
      const preps = prev.interviewPreps ?? [];
      const exists = preps.find((p) => p.jobId === prep.jobId);
      return {
        ...prev,
        interviewPreps: exists
          ? preps.map((p) => (p.jobId === prep.jobId ? prep : p))
          : [...preps, prep],
      };
    });
  }

  function saveStory(data: Omit<StarStory, 'id'>) {
    setState((prev) => {
      const stories = prev.starStories ?? [];
      const existing = editStory?.id ? stories.find((s) => s.id === editStory.id) : null;
      return {
        ...prev,
        starStories: existing
          ? stories.map((s) => (s.id === existing.id ? { ...data, id: s.id } : s))
          : [...stories, { ...data, id: `ss-${Date.now()}` }],
      };
    });
    setEditStory(null);
  }

  function deleteStory(id: string) {
    if (!confirm('Delete this story?')) return;
    setState((prev) => ({
      ...prev,
      starStories: (prev.starStories ?? []).filter((s) => s.id !== id),
    }));
  }

  const allCompetencies = Array.from(new Set(starStories.flatMap((s) => s.competencies)));
  const filteredStories =
    compFilter === 'all' ? starStories : starStories.filter((s) => s.competencies.includes(compFilter));

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Interview Prep</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {activeJobs.length} active pipeline job{activeJobs.length !== 1 ? 's' : ''} · {starStories.length} STAR {starStories.length === 1 ? 'story' : 'stories'}
          </p>
        </div>
        {tab === 'stories' && (
          <button onClick={() => setEditStory({})} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Story
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="mt-4 flex border-b border-zinc-200">
        {(['companies', 'stories'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {t === 'companies' ? '🏢 Companies' : '⭐ STAR Stories'}
          </button>
        ))}
      </div>

      {/* Companies tab */}
      {tab === 'companies' && (
        <div className="mt-4">
          {activeJobs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500">
              No jobs at screening, interview, or offer stage yet.
              <br />
              <a href="#/jobs" className="mt-1 inline-block font-medium text-zinc-800 underline">
                Go to Jobs tracker →
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {activeJobs.map((job) => (
                <CompanyPrepPanel
                  key={job.id}
                  jobLabel={`${job.company} — ${job.role}`}
                  prep={getPrep(job.id)}
                  onUpdate={updatePrep}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* STAR Stories tab */}
      {tab === 'stories' && (
        <div className="mt-4">
          {starStories.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              <button
                onClick={() => setCompFilter('all')}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  compFilter === 'all' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                All
              </button>
              {allCompetencies.map((c) => (
                <button
                  key={c}
                  onClick={() => setCompFilter(c)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    compFilter === c ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {filteredStories.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500">
              {starStories.length === 0
                ? 'No STAR stories yet. Add one to build your behavioral interview bank.'
                : 'No stories match this competency filter.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredStories.map((s) => (
                <StarCard key={s.id} story={s} onEdit={() => setEditStory(s)} onDelete={() => deleteStory(s.id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {editStory !== null && (
        <StarForm initial={editStory} onSave={saveStory} onCancel={() => setEditStory(null)} />
      )}
    </div>
  );
}
