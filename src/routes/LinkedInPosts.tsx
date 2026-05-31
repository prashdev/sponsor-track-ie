import { useState } from 'react';
import { Copy, Check, Megaphone, Calendar, Tag, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { useStaticData } from '../hooks/useStaticData';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LinkedInPost {
  id: string;
  week: number;
  slot: number;
  best_day: string;
  category: string;
  title: string;
  hook: string;
  body: string;
  hashtags: string[];
  image_suggestion: string;
}

interface PostsFile {
  intro: string;
  posts: LinkedInPost[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const POSTED_KEY = 'sponsor-track-ie:linkedin-posted';

function loadPosted(): Set<string> {
  try {
    const raw = localStorage.getItem(POSTED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function savePosted(set: Set<string>) {
  localStorage.setItem(POSTED_KEY, JSON.stringify(Array.from(set)));
}

function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  isPosted,
  onTogglePosted,
}: {
  post: LinkedInPost;
  isPosted: boolean;
  onTogglePosted: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copiedState, setCopiedState] = useState<'body' | 'full' | null>(null);

  function handleCopy(kind: 'body' | 'full') {
    const text =
      kind === 'body'
        ? post.body
        : `${post.body}\n\n${post.hashtags.join(' ')}`;
    copyToClipboard(text).then(() => {
      setCopiedState(kind);
      setTimeout(() => setCopiedState(null), 2000);
    });
  }

  return (
    <div
      className={`rounded-lg border bg-white p-4 transition-all ${
        isPosted ? 'border-emerald-200 bg-emerald-50/40 opacity-70' : 'border-zinc-200 hover:border-zinc-300'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div className="shrink-0 rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-bold text-white">
            W{post.week} · #{post.slot}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-900">{post.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
              <span className="flex items-center gap-1"><Calendar size={9} />{post.best_day}</span>
              <span className="flex items-center gap-1"><Tag size={9} />{post.category}</span>
            </div>
          </div>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[11px] text-zinc-600">
          <input
            type="checkbox"
            checked={isPosted}
            onChange={onTogglePosted}
            className="h-3.5 w-3.5 rounded border-zinc-300 accent-emerald-600"
          />
          Posted
        </label>
      </div>

      {/* Hook */}
      <p className="mt-3 text-xs italic text-zinc-600">"{post.hook}"</p>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
      >
        {expanded ? <><ChevronUp size={12} /> Hide full post</> : <><ChevronDown size={12} /> Show full post</>}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <pre className="whitespace-pre-wrap rounded-md border border-zinc-100 bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-800 font-sans">
            {post.body}
          </pre>

          <div className="flex flex-wrap gap-1">
            {post.hashtags.map((h) => (
              <span key={h} className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700">{h}</span>
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
            <ImageIcon size={11} className="mt-0.5 shrink-0" />
            <span><strong>Image idea:</strong> {post.image_suggestion}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCopy('body')}
              className="flex items-center gap-1.5 rounded border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400"
            >
              {copiedState === 'body' ? <><Check size={11} className="text-emerald-500" /> Copied body</> : <><Copy size={11} /> Copy body only</>}
            </button>
            <button
              onClick={() => handleCopy('full')}
              className="flex items-center gap-1.5 rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
            >
              {copiedState === 'full' ? <><Check size={11} /> Copied with hashtags</> : <><Copy size={11} /> Copy body + hashtags</>}
            </button>
            <a
              href="https://www.linkedin.com/feed/?shareActive=true"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
            >
              <Megaphone size={11} /> Open LinkedIn composer
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main route ───────────────────────────────────────────────────────────────

export default function LinkedInPosts() {
  const { data, loading, error } = useStaticData<PostsFile>('data/linkedin-posts.json');
  const [postedSet, setPostedSet] = useState<Set<string>>(() => loadPosted());
  const [hideePosted, setHidePosted] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  function togglePosted(id: string) {
    setPostedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      savePosted(next);
      return next;
    });
  }

  if (loading) return <div className="text-sm text-zinc-400">Loading posts…</div>;
  if (error || !data) return <div className="text-sm text-red-500">Failed to load: {error}</div>;

  const categories = ['all', ...Array.from(new Set(data.posts.map((p) => p.category)))];

  const filtered = data.posts.filter((p) => {
    if (hideePosted && postedSet.has(p.id)) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    return true;
  });

  const weeks = Array.from(new Set(filtered.map((p) => p.week))).sort((a, b) => a - b);
  const totalPosted = data.posts.filter((p) => postedSet.has(p.id)).length;

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">LinkedIn Post Drafts</h1>
          <p className="mt-1 text-sm text-zinc-500">{data.intro}</p>
        </div>
        <Megaphone size={28} className="mt-1 shrink-0 text-blue-600" />
      </div>

      {/* Progress + filters */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700">
          <strong className="text-zinc-900">{totalPosted}</strong> / {data.posts.length} posted
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={hideePosted}
            onChange={(e) => setHidePosted(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 accent-zinc-800"
          />
          Hide already-posted
        </label>
        <span className="ml-auto text-xs text-zinc-400">{filtered.length} shown</span>
      </div>

      {/* Tip */}
      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
        <strong>How to use:</strong> Post twice per week (Tuesday + Thursday for best reach). Click "Show full post",
        copy with hashtags, paste to LinkedIn, add the suggested image, ship. Tick "Posted" so you don't re-post by accident.
        Local-only — nothing leaves your browser.
      </div>

      {/* Posts grouped by week */}
      <div className="mt-6 space-y-6">
        {weeks.map((w) => {
          const weekPosts = filtered.filter((p) => p.week === w);
          return (
            <div key={w}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
                Week {w}
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {weekPosts.map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    isPosted={postedSet.has(p.id)}
                    onTogglePosted={() => togglePosted(p.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-zinc-400">
        12 weeks × 2 posts = 24 drafts covering AppSec, AI security, GRC, career story, tooling, hot takes.
        Each post is calibrated to your background (Cubic Telecom, Indusface, Maharashtra Cyber Cell, Hall of Fame disclosures, MSc Cybersecurity NCI, AI/LLM interest, ISO 27001 + DORA study).
        Edit before posting to add personal touches.
      </p>
    </div>
  );
}
