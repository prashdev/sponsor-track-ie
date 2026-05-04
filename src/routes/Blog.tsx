import { useState } from 'react';
import { Shuffle, ExternalLink, PenLine } from 'lucide-react';
import { useStaticData } from '../hooks/useStaticData';
import { useAppState } from '../hooks/useLocalStorage';
import type { BlogSeed } from '../lib/types';

const THEME_LABELS: Record<string, string> = {
  'ai-llm-security': 'AI / LLM Security',
  'appsec': 'AppSec',
  'hall-of-fame': 'Hall of Fame',
  'grc-dora': 'GRC / DORA',
  'career-change': 'Career',
};

const THEME_COLORS: Record<string, string> = {
  'ai-llm-security': 'bg-purple-100 text-purple-700',
  'appsec': 'bg-blue-100 text-blue-700',
  'hall-of-fame': 'bg-amber-100 text-amber-700',
  'grc-dora': 'bg-zinc-100 text-zinc-600',
  'career-change': 'bg-emerald-100 text-emerald-700',
};

const STATUS_LABELS = { idea: 'Idea', drafted: 'Drafted', published: 'Published' };
const STATUS_CYCLE: Record<string, 'drafted' | 'published' | 'idea'> = {
  idea: 'drafted',
  drafted: 'published',
  published: 'idea',
};
const STATUS_COLORS: Record<string, string> = {
  idea: 'bg-zinc-100 text-zinc-500',
  drafted: 'bg-yellow-100 text-yellow-700',
  published: 'bg-emerald-100 text-emerald-700',
};

export default function Blog() {
  const { data: seeds, loading, error } = useStaticData<BlogSeed[]>('data/blog-seeds.json');
  const [state, setState] = useAppState();
  const [shuffled, setShuffled] = useState<string[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) return <div className="text-sm text-zinc-500">Loading ideas…</div>;
  if (error || !seeds) return <div className="text-sm text-red-500">Failed to load blog seeds: {error}</div>;

  function getIdea(seedId: string) {
    return state.blogIdeas.find((b) => b.seedId === seedId);
  }

  function getStatus(seedId: string): 'idea' | 'drafted' | 'published' {
    return getIdea(seedId)?.status ?? 'idea';
  }

  function cycleStatus(seedId: string) {
    const current = getStatus(seedId);
    const next = STATUS_CYCLE[current];
    setState((prev) => {
      const existing = prev.blogIdeas.find((b) => b.seedId === seedId);
      if (existing) {
        return { ...prev, blogIdeas: prev.blogIdeas.map((b) => b.seedId === seedId ? { ...b, status: next } : b) };
      }
      return { ...prev, blogIdeas: [...prev.blogIdeas, { seedId, status: next, publishedUrl: '', hook: '' }] };
    });
  }

  function updateField(seedId: string, field: 'hook' | 'publishedUrl', value: string) {
    setState((prev) => {
      const existing = prev.blogIdeas.find((b) => b.seedId === seedId);
      if (existing) {
        return { ...prev, blogIdeas: prev.blogIdeas.map((b) => b.seedId === seedId ? { ...b, [field]: value } : b) };
      }
      return { ...prev, blogIdeas: [...prev.blogIdeas, { seedId, status: 'idea', publishedUrl: '', hook: '', [field]: value }] };
    });
  }

  function shuffle() {
    if (!seeds) return;
    const unused = seeds.filter((s) => getStatus(s.id) === 'idea').map((s) => s.id);
    const pool = unused.length >= 3 ? unused : seeds.map((s) => s.id);
    const picked: string[] = [];
    const copy = [...pool];
    for (let i = 0; i < Math.min(3, copy.length); i++) {
      const idx = Math.floor(Math.random() * copy.length);
      picked.push(copy.splice(idx, 1)[0]);
    }
    setShuffled(picked);
  }

  const filtered = (shuffled
    ? seeds.filter((s) => shuffled.includes(s.id))
    : seeds
  ).filter((s) => {
    if (statusFilter !== 'all' && getStatus(s.id) !== statusFilter) return false;
    if (themeFilter !== 'all' && s.theme !== themeFilter) return false;
    return true;
  });

  const themes = Array.from(new Set(seeds.map((s) => s.theme)));

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Blog Ideas</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {seeds.length} seeds &mdash; {state.blogIdeas.filter((b) => b.status === 'published').length} published
          </p>
        </div>
        <button onClick={shuffle} className="btn-secondary flex items-center gap-2">
          <Shuffle size={15} /> Shuffle 3
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(['all', 'idea', 'drafted', 'published'] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setShuffled(null); }}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusFilter === s && !shuffled ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
          >
            {s === 'all' ? 'All' : STATUS_LABELS[s]}
          </button>
        ))}
        <span className="text-zinc-300">|</span>
        {themes.map((t) => (
          <button
            key={t}
            onClick={() => { setThemeFilter(t === themeFilter ? 'all' : t); setShuffled(null); }}
            className={`rounded-full px-3 py-1 text-xs font-medium ${themeFilter === t ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
          >
            {THEME_LABELS[t] ?? t}
          </button>
        ))}
      </div>

      {shuffled && (
        <div className="mt-2 flex items-center gap-2">
          <p className="text-xs text-zinc-500">Showing 3 random picks.</p>
          <button onClick={() => setShuffled(null)} className="text-xs text-blue-600 hover:underline">Show all</button>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {filtered.map((seed) => {
          const status = getStatus(seed.id);
          const idea = getIdea(seed.id);
          const isExpanded = expandedId === seed.id;

          return (
            <div key={seed.id} className="rounded-lg border border-zinc-200 bg-white">
              <button
                onClick={() => setExpandedId(isExpanded ? null : seed.id)}
                className="flex w-full items-start gap-4 px-5 py-4 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${THEME_COLORS[seed.theme] ?? 'bg-zinc-100 text-zinc-500'}`}>
                      {THEME_LABELS[seed.theme] ?? seed.theme}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_COLORS[status]}`}>
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="text-[11px] text-zinc-400">{seed.est_read_time} read</span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-zinc-900">{seed.prompt}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{seed.angle}</p>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-zinc-100 px-5 pb-4">
                  <label className="label mt-3">Draft hook / opening line</label>
                  <textarea
                    className="input min-h-[60px] resize-none"
                    placeholder="Write your opening hook here before opening LinkedIn…"
                    value={idea?.hook ?? ''}
                    onChange={(e) => updateField(seed.id, 'hook', e.target.value)}
                  />

                  {status === 'published' && (
                    <>
                      <label className="label mt-3">Published URL</label>
                      <div className="flex items-center gap-2">
                        <input
                          className="input flex-1"
                          type="url"
                          placeholder="https://linkedin.com/posts/..."
                          value={idea?.publishedUrl ?? ''}
                          onChange={(e) => updateField(seed.id, 'publishedUrl', e.target.value)}
                        />
                        {idea?.publishedUrl && (
                          <a href={idea.publishedUrl} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-zinc-700">
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                    </>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => cycleStatus(seed.id)}
                      className="flex items-center gap-1.5 rounded border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      <PenLine size={12} />
                      Mark as {STATUS_LABELS[STATUS_CYCLE[status]]}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500">
            No ideas match the current filter.
          </div>
        )}
      </div>
    </div>
  );
}
