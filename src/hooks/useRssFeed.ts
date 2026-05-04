import { useState, useEffect } from 'react';

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  author: string;
  description: string;
}

interface UseFeedResult {
  items: FeedItem[];
  loading: boolean;
  error: string | null;
}

export function useRssFeed(feedUrl: string): UseFeedResult {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!feedUrl) return;
    let cancelled = false;

    const fetchFeed = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.status !== 'ok') throw new Error(data.message || 'Feed error');
        if (!cancelled) setItems(data.items || []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load feed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFeed();
    return () => { cancelled = true; };
  }, [feedUrl]);

  return { items, loading, error };
}
