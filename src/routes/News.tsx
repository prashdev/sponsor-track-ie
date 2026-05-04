import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ExternalLink, Bookmark, BookmarkCheck, Circle } from 'lucide-react';
import { useStaticData } from '../hooks/useStaticData';
import { useAppState } from '../hooks/useLocalStorage';
import type { NewsSource, SavedArticle } from '../lib/types';

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  author: string;
}

interface FeedResult {
  source: string;
  topic: string;
  items: FeedItem[];
  error?: string;
}

function articleId(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (Math.imul(31, h) + url.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function useFeedAggregator(sources: NewsSource[] | null) {
  const [results, setResults] = useState<FeedResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sources || sources.length === 0) return;
    setLoading(true);
    const fetched: FeedResult[] = [];
    let done = 0;

    sources.forEach((src) => {
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(src.url)}&count=10`;
      fetch(apiUrl)
        .then((r) => r.json())
        .then((data) => {
          fetched.push({ source: src.name, topic: src.topic, items: data.status === 'ok' ? data.items || [] : [] });
        })
        .catch(() => {
          fetched.push({ source: src.name, topic: src.topic, items: [], error: 'Failed to load' });
        })
        .finally(() => {
          done++;
          if (done === sources.length) {
            setResults([...fetched]);
            setLoading(false);
          }
        });
    });
  }, [sources]);

  return { results, loading };
}

export default function News() {
  const { data: sources } = useStaticData<NewsSource[]>('data/news-sources.json');
  const [state, setState] = useAppState();
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [view, setView] = useState<'feed' | 'saved'>('feed');

  const { results, loading } = useFeedAggregator(sources);

  const filteredSources = topicFilter === 'all' ? results : results.filter((r) => r.topic === topicFilter);

  const allItems = filteredSources
    .flatMap((r) => r.items.map((item) => ({ ...item, source: r.source, topic: r.topic })))
    .sort((a, b) => (b.pubDate ?? '').localeCompare(a.pubDate ?? ''));

  function markRead(url: string) {
    const id = articleId(url);
    setState((prev) => ({
      ...prev,
      readArticles: prev.readArticles.includes(id) ? prev.readArticles.filter((x) => x !== id) : [...prev.readArticles, id],
    }));
  }

  function toggleSave(item: FeedItem & { source: string }) {
    const id = articleId(item.link);
    setState((prev) => {
      const already = prev.readLaterArticles.find((a) => a.id === id);
      return {
        ...prev,
        readLaterArticles: already
          ? prev.readLaterArticles.filter((a) => a.id !== id)
          : [...prev.readLaterArticles, { id, title: item.title, url: item.link, source: item.source, savedAt: new Date().toISOString() }],
      };
    });
  }

  function isSaved(url: string): boolean {
    return state.readLaterArticles.some((a) => a.id === articleId(url));
  }

  function formatDate(dateStr: string): string {
    try {
      return format(parseISO(dateStr), 'dd MMM yyyy');
    } catch {
      return dateStr?.slice(0, 10) ?? '';
    }
  }

  const topics = ['all', ...Array.from(new Set((sources ?? []).map((s) => s.topic)))];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">News</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {state.readArticles.length} read &mdash; {state.readLaterArticles.length} saved for later
          </p>
        </div>
        <div className="flex rounded-lg border border-zinc-200 bg-white">
          {(['feed', 'saved'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm first:rounded-l-lg last:rounded-r-lg ${view === v ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50'}`}
            >
              {v === 'feed' ? 'Live Feed' : `Saved (${state.readLaterArticles.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {topics.map((t) => (
          <button
            key={t}
            onClick={() => setTopicFilter(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${topicFilter === t ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
          >
            {t === 'all' ? 'All' : t}
          </button>
        ))}
      </div>

      {view === 'feed' ? (
        <div className="mt-4">
          {loading && (
            <div className="text-sm text-zinc-500">Loading feeds…</div>
          )}
          {!loading && allItems.length === 0 && (
            <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500">
              No articles loaded. Check your internet connection.
            </div>
          )}
          <ul className="space-y-2">
            {allItems.map((item) => {
              const id = articleId(item.link);
              const read = state.readArticles.includes(id);
              const saved = isSaved(item.link);
              return (
                <li
                  key={item.link}
                  className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${read ? 'border-zinc-100 bg-zinc-50' : 'border-zinc-200 bg-white'}`}
                >
                  <button onClick={() => markRead(item.link)} className="mt-1 shrink-0">
                    <Circle size={10} className={read ? 'fill-zinc-300 text-zinc-300' : 'fill-blue-500 text-blue-500'} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => { if (!read) markRead(item.link); }}
                      className={`flex items-start gap-1 text-sm font-medium hover:underline ${read ? 'text-zinc-400' : 'text-zinc-900'}`}
                    >
                      {item.title}
                      <ExternalLink size={11} className="mt-0.5 shrink-0 text-zinc-400" />
                    </a>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                      <span className="font-medium">{item.source}</span>
                      <span>&middot;</span>
                      <span>{formatDate(item.pubDate)}</span>
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 capitalize">{item.topic}</span>
                    </div>
                  </div>
                  <button onClick={() => toggleSave(item)} className="mt-0.5 shrink-0 text-zinc-400 hover:text-zinc-700">
                    {saved ? <BookmarkCheck size={16} className="text-blue-600" /> : <Bookmark size={16} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="mt-4">
          {state.readLaterArticles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500">
              No saved articles. Bookmark items from the live feed.
            </div>
          ) : (
            <ul className="space-y-2">
              {state.readLaterArticles.map((a: SavedArticle) => (
                <li key={a.id} className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <a href={a.url} target="_blank" rel="noreferrer" className="flex items-start gap-1 text-sm font-medium text-zinc-900 hover:underline">
                      {a.title} <ExternalLink size={11} className="mt-0.5 shrink-0 text-zinc-400" />
                    </a>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                      <span className="font-medium">{a.source}</span>
                      <span>&middot;</span>
                      <span>Saved {formatDate(a.savedAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setState((prev) => ({ ...prev, readLaterArticles: prev.readLaterArticles.filter((x) => x.id !== a.id) }))}
                    className="shrink-0 text-zinc-400 hover:text-red-500"
                  >
                    <BookmarkCheck size={16} className="text-blue-600" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
