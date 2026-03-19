'use client';

import { useState, useCallback, useRef, FormEvent } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-194a.up.railway.app';

interface SearchResult {
  type: 'task' | 'idea' | 'project';
  id: string;
  title: string;
  description?: string;
  meta: Record<string, string | undefined>;
  score: number;
  href: string;
}

const TYPE_ICON: Record<string, string> = { task: '✅', idea: '💡', project: '🚀' };
const TYPE_BADGE: Record<string, string> = {
  task:    'bg-blue-900 text-blue-200',
  idea:    'bg-yellow-900 text-yellow-200',
  project: 'bg-purple-900 text-purple-200',
};

export default function SearchWidget() {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounce = useRef<NodeJS.Timeout | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setSearched(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInput(val: string) {
    setQuery(val);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => doSearch(val), 350);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    doSearch(query);
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={query}
            onChange={e => handleInput(e.target.value)}
            placeholder="Search tasks, projects, ideas…"
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          {loading && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs animate-pulse">
              searching…
            </span>
          )}
        </div>
      </form>

      {searched && results.length === 0 && !loading && (
        <p className="text-gray-600 text-sm mt-3 text-center">No results for "{query}"</p>
      )}

      {results.length > 0 && (
        <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
          {results.slice(0, 8).map(r => (
            <Link key={r.id} href={r.href}
              className="flex items-start gap-3 px-3 py-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-blue-600 rounded-lg transition-colors">
              <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${TYPE_BADGE[r.type]}`}>
                {TYPE_ICON[r.type]} {r.type}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{r.title}</p>
                {r.description && <p className="text-gray-500 text-xs truncate">{r.description}</p>}
              </div>
              <span className="text-gray-600 text-xs shrink-0 font-mono">{r.id}</span>
            </Link>
          ))}
          {results.length > 8 && (
            <Link href={`/search`}
              className="block text-center text-blue-400 text-xs hover:underline py-1">
              +{results.length - 8} more → full search
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
