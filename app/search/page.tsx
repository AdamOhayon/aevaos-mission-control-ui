"use client";
import { useState, useCallback, useRef, FormEvent } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";

interface SearchResult {
  type: "task" | "idea" | "project";
  id: string;
  title: string;
  description: string;
  meta: Record<string, string | undefined>;
  score: number;
  href: string;
}

const TYPE_ICON: Record<string, string> = { task: "✅", idea: "💡", project: "🚀" };
const TYPE_BADGE: Record<string, string> = {
  task:    "bg-blue-900 text-blue-200",
  idea:    "bg-yellow-900 text-yellow-200",
  project: "bg-purple-900 text-purple-200",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounce = useRef<NodeJS.Timeout | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}`);
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
    debounce.current = setTimeout(() => doSearch(val), 300);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    doSearch(query);
  }

  const grouped = {
    task:    results.filter(r => r.type === "task"),
    project: results.filter(r => r.type === "project"),
    idea:    results.filter(r => r.type === "idea"),
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">🔍 Search</h1>
          <p className="text-gray-400 text-sm">Search across tasks, projects, and ideas</p>
        </div>

        {/* Search box */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              type="text"
              value={query}
              onChange={e => handleInput(e.target.value)}
              placeholder="Type to search… (tasks, projects, ideas)"
              autoFocus
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl pl-11 pr-4 py-3.5 text-base focus:outline-none focus:border-blue-500 transition-colors"
            />
            {loading && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm animate-pulse">searching…</span>
            )}
          </div>
        </form>

        {/* Results */}
        {!searched && !loading && (
          <div className="text-center py-16 text-gray-600">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg">Search anything — tasks, ideas, projects</p>
            <p className="text-sm mt-2">Instant results as you type</p>
          </div>
        )}

        {searched && results.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-600">
            <p className="text-5xl mb-4">😶</p>
            <p className="text-lg">No results for "{query}"</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-6">
            <p className="text-gray-400 text-sm">{results.length} result{results.length !== 1 ? "s" : ""} for "{query}"</p>

            {(["task", "project", "idea"] as const).map(type => (
              grouped[type].length > 0 && (
                <div key={type}>
                  <h2 className="text-gray-400 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span>{TYPE_ICON[type]}</span> {type}s
                  </h2>
                  <div className="space-y-2">
                    {grouped[type].map(result => (
                      <Link
                        key={result.id}
                        href={result.href}
                        className="block bg-gray-900 border border-gray-800 hover:border-blue-600 rounded-xl p-4 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${TYPE_BADGE[result.type]}`}>
                            {result.type}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-gray-500 text-xs font-mono">{result.id}</span>
                              <span className="text-white text-sm font-medium">{result.title}</span>
                            </div>
                            {result.description && (
                              <p className="text-gray-500 text-xs line-clamp-2">{result.description}</p>
                            )}
                            <div className="flex gap-3 mt-2">
                              {Object.entries(result.meta).map(([k, v]) =>
                                v ? (
                                  <span key={k} className="text-gray-600 text-xs">
                                    {k}: <span className="text-gray-400">{v}</span>
                                  </span>
                                ) : null
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
