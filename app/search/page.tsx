"use client";
import { useState, useCallback, useRef, FormEvent } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";

interface SearchResult { type: "task" | "idea" | "project"; id: string; title: string; description: string; meta: Record<string, string | undefined>; score: number; href: string; }

const TYPE_ICON: Record<string, string> = { task: "✅", idea: "💡", project: "🚀" };
const TYPE_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  task:    { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  idea:    { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  project: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounce = useRef<NodeJS.Timeout | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try { const res = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}`); const data = await res.json(); setResults(data.results ?? []); setSearched(true); }
    catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  function handleInput(val: string) {
    setQuery(val);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => doSearch(val), 300);
  }
  function handleSubmit(e: FormEvent) { e.preventDefault(); doSearch(query); }

  const grouped = {
    task: results.filter(r => r.type === "task"),
    project: results.filter(r => r.type === "project"),
    idea: results.filter(r => r.type === "idea"),
  };

  return (
    <div className="min-h-screen bg-[var(--aeva-bg)] pt-16 grid-bg">
      <div className="max-w-3xl mx-auto px-6 py-8 relative z-10">

        <div className="mb-8 animate-in">
          <h1 className="text-3xl font-bold text-white mb-1">🔍 Search</h1>
          <p className="text-[var(--aeva-text-dim)] text-sm">Search across tasks, projects, and ideas</p>
        </div>

        {/* Search box */}
        <form onSubmit={handleSubmit} className="mb-8 animate-in animate-in-delay-1">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--aeva-text-muted)] text-lg">🔍</span>
            <input
              type="text" value={query} onChange={e => handleInput(e.target.value)} autoFocus
              placeholder="Type to search… (tasks, projects, ideas)"
              className="w-full bg-[var(--aeva-surface)] border border-[var(--aeva-border)] text-white rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-[var(--aeva-blue)] focus:shadow-[0_0_16px_rgba(59,130,246,0.12)] transition-all placeholder-[var(--aeva-text-muted)]"
            />
            {loading && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--aeva-text-muted)] text-xs animate-pulse">searching…</span>
            )}
          </div>
        </form>

        {/* Empty states */}
        {!searched && !loading && (
          <div className="text-center py-16 text-[var(--aeva-text-muted)] animate-in animate-in-delay-2">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-[var(--aeva-text-dim)] text-lg">Search anything</p>
            <p className="text-sm mt-1">Instant results as you type</p>
          </div>
        )}
        {searched && results.length === 0 && !loading && (
          <div className="text-center py-16 text-[var(--aeva-text-muted)] animate-in">
            <p className="text-5xl mb-4">😶</p>
            <p className="text-[var(--aeva-text-dim)] text-lg">No results for &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-6 animate-in">
            <p className="text-[var(--aeva-text-muted)] text-xs">{results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;</p>

            {(["task", "project", "idea"] as const).map(type =>
              grouped[type].length > 0 && (
                <div key={type}>
                  <h2 className="text-[var(--aeva-text-muted)] text-[10px] uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <span>{TYPE_ICON[type]}</span> {type}s
                  </h2>
                  <div className="space-y-2">
                    {grouped[type].map((result, i) => {
                      const tc = TYPE_COLOR[result.type];
                      return (
                        <Link key={result.id} href={result.href}
                          className="card-glow block p-4 animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                          <div className="flex items-start gap-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 mt-0.5 ${tc.bg} ${tc.text} ${tc.border}`}>{result.type}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[var(--aeva-text-muted)] text-xs font-mono">{result.id}</span>
                                <span className="text-white text-sm font-medium">{result.title}</span>
                              </div>
                              {result.description && <p className="text-[var(--aeva-text-dim)] text-xs line-clamp-2">{result.description}</p>}
                              <div className="flex gap-3 mt-2">
                                {Object.entries(result.meta).map(([k, v]) =>
                                  v ? <span key={k} className="text-[var(--aeva-text-muted)] text-[10px]">{k}: <span className="text-[var(--aeva-text-dim)]">{v}</span></span> : null
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
