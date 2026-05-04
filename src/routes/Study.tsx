import { useState, useRef, useEffect } from 'react';
import { ExternalLink, Play, Square, CheckSquare, ChevronDown, ChevronRight } from 'lucide-react';
import { useStaticData } from '../hooks/useStaticData';
import { useAppState } from '../hooks/useLocalStorage';
import type { Resource } from '../lib/types';

const TRACK_LABELS: Record<string, string> = {
  'appsec': 'Application Security',
  'ai-security': 'AI Security',
  'llm-security': 'LLM Security',
  'soc': 'SOC Analyst',
  'customer-support-to-tech': 'Customer Support → Tech',
};

const LEVEL_BADGE: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced: 'bg-purple-100 text-purple-700',
};

export default function Study() {
  const { data: resources, loading, error } = useStaticData<Resource[]>('data/resources.json');
  const [state, setState] = useAppState();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [timerTrack, setTimerTrack] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  if (loading) return <div className="text-sm text-zinc-500">Loading resources…</div>;
  if (error || !resources) return <div className="text-sm text-red-500">Failed to load resources: {error}</div>;

  const tracks = Object.keys(TRACK_LABELS);
  const byTrack = Object.fromEntries(
    tracks.map((t) => [t, resources.filter((r) => r.track === t)])
  );

  function toggleResource(id: string) {
    setState((prev) => ({
      ...prev,
      studyProgress: { ...prev.studyProgress, [id]: !prev.studyProgress[id] },
    }));
  }

  function toggleCollapse(t: string) {
    setCollapsed((prev) => ({ ...prev, [t]: !prev[t] }));
  }

  function startTimer(track: string) {
    setTimerTrack(track);
    setElapsed(0);
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current!) / 1000));
    }, 1000);
  }

  function stopTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const minutes = Math.max(1, Math.round(elapsed / 60));
    if (timerTrack) {
      setState((prev) => ({
        ...prev,
        studyLog: [
          ...prev.studyLog,
          { id: `sl-${Date.now()}`, track: timerTrack, date: new Date().toISOString(), minutes },
        ],
      }));
    }
    setTimerTrack(null);
    setElapsed(0);
    startRef.current = null;
  }

  function fmt(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function nextUp(track: string): Resource | undefined {
    return byTrack[track]?.find((r) => !state.studyProgress[r.id] && r.level === 'beginner')
      ?? byTrack[track]?.find((r) => !state.studyProgress[r.id]);
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Study</h1>
          <p className="mt-1 text-sm text-zinc-500">Free resources across {tracks.length} tracks.</p>
        </div>
        {timerTrack && (
          <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2">
            <span className="text-xs text-zinc-500">{TRACK_LABELS[timerTrack] ?? timerTrack}</span>
            <span className="font-mono text-lg font-semibold text-zinc-900">{fmt(elapsed)}</span>
            <button onClick={stopTimer} className="flex items-center gap-1 rounded bg-zinc-900 px-3 py-1 text-xs text-white hover:bg-zinc-700">
              <Square size={12} /> Stop &amp; log
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {tracks.map((track) => {
          const items = byTrack[track] ?? [];
          const done = items.filter((r) => state.studyProgress[r.id]).length;
          const pct = items.length ? Math.round((done / items.length) * 100) : 0;
          const isOpen = !collapsed[track];
          const next = nextUp(track);

          return (
            <div key={track} className="rounded-lg border border-zinc-200 bg-white">
              <button
                onClick={() => toggleCollapse(track)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown size={16} className="text-zinc-400" /> : <ChevronRight size={16} className="text-zinc-400" />}
                  <span className="font-medium text-zinc-900">{TRACK_LABELS[track]}</span>
                  <span className="text-xs text-zinc-500">{done}/{items.length}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-32 rounded-full bg-zinc-100">
                    <div className="h-1.5 rounded-full bg-zinc-800 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-9 text-right text-xs font-medium text-zinc-500">{pct}%</span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-zinc-100 px-5 pb-4">
                  {next && (
                    <div className="mb-3 mt-3 flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                      <span className="font-medium text-zinc-800">Next up:</span>
                      <a href={next.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                        {next.title} <ExternalLink size={10} />
                      </a>
                    </div>
                  )}

                  <ul className="mt-2 space-y-2">
                    {items.map((r) => (
                      <li key={r.id} className="flex items-start gap-3">
                        <button
                          onClick={() => toggleResource(r.id)}
                          className={`mt-0.5 shrink-0 ${state.studyProgress[r.id] ? 'text-emerald-600' : 'text-zinc-300 hover:text-zinc-500'}`}
                        >
                          <CheckSquare size={18} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center gap-1 text-sm font-medium hover:underline ${state.studyProgress[r.id] ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}
                            >
                              {r.title} <ExternalLink size={11} className="text-zinc-400" />
                            </a>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${LEVEL_BADGE[r.level] ?? 'bg-zinc-100 text-zinc-500'}`}>
                              {r.level}
                            </span>
                            <span className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">{r.type}</span>
                          </div>
                          {r.notes && <p className="mt-0.5 text-xs text-zinc-500">{r.notes}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>

                  {!timerTrack && (
                    <button
                      onClick={() => startTimer(track)}
                      className="mt-4 flex items-center gap-1.5 rounded border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      <Play size={12} /> Start study session
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
