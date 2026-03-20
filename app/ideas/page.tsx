"use client";
import { useState, useEffect, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";

const CAT_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  vision:   { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  project:  { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20' },
  research: { bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   border: 'border-cyan-500/20' },
  feature:  { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/20' },
};
const STATUS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  'in-progress': { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20' },
  documented:    { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/20' },
  new:           { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/20' },
};

interface Idea { id: string; title: string; description?: string; category?: string; status?: string; source?: string; capturedAt?: string; tags?: string[]; notionUrl?: string; }

export default function IdeasPage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState(""); const [category, setCategory] = useState("research");
  const [submitting, setSubmitting] = useState(false);
  const [filterCat, setFilterCat] = useState(""); const [filterStatus, setFilterSt] = useState(""); const [sortOrder, setSortOrder] = useState<"newest"|"oldest">("newest");

  const fetchIdeas = useCallback(async () => {
    try { const res = await fetch(`${API}/api/ideas`); if (res.ok) { const data = await res.json(); setIdeas(data.ideas ?? []); } }
    catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  async function handleCapture(e: FormEvent) {
    e.preventDefault(); if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/ideas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description: desc, category, source: "mission-control-ui" }) });
      if (res.ok) { setTitle(""); setDesc(""); setCategory("research"); setShowForm(false); fetchIdeas(); }
    } finally { setSubmitting(false); }
  }

  function timeAgo(ts?: string) {
    if (!ts) return "—"; const d = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
    if (d === 0) return "Today"; if (d === 1) return "Yesterday"; return `${d}d ago`;
  }

  const displayed = ideas
    .filter(i => !filterCat || i.category === filterCat)
    .filter(i => !filterStatus || i.status === filterStatus)
    .sort((a, b) => { const ta = new Date(a.capturedAt ?? 0).getTime(); const tb = new Date(b.capturedAt ?? 0).getTime(); return sortOrder === "newest" ? tb - ta : ta - tb; });

  return (
    <div className="min-h-screen bg-[var(--aeva-bg)] pt-16 grid-bg">
      <div className="max-w-4xl mx-auto px-6 py-8 relative z-10">
        <div className="flex items-center justify-between mb-8 animate-in flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white">💡 Ideas</h1>
            <p className="text-[var(--aeva-text-dim)] mt-1 text-sm">{ideas.length} captured ideas</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="bg-[var(--aeva-surface)] text-[var(--aeva-text-dim)] border border-[var(--aeva-border)] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[var(--aeva-blue)]">
              <option value="">All categories</option>
              {["vision","project","research","feature"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterSt(e.target.value)}
              className="bg-[var(--aeva-surface)] text-[var(--aeva-text-dim)] border border-[var(--aeva-border)] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[var(--aeva-blue)]">
              <option value="">All statuses</option>
              {["new","in-progress","documented"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as "newest"|"oldest")}
              className="bg-[var(--aeva-surface)] text-[var(--aeva-text-dim)] border border-[var(--aeva-border)] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[var(--aeva-blue)]">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
            <button onClick={() => setShowForm(v => !v)}
              className="px-4 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium hover:bg-blue-600/30 transition-colors">
              + Capture Idea
            </button>
          </div>
        </div>

        {/* Capture form */}
        {showForm && (
          <form onSubmit={handleCapture} className="card-glow p-5 mb-6 space-y-3 animate-in">
            <h2 className="text-white font-semibold text-sm">New Idea</h2>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Idea title…" required
              className="w-full bg-[var(--aeva-bg)] text-white border border-[var(--aeva-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--aeva-blue)] transition-all placeholder-[var(--aeva-text-muted)]" />
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe the idea…" rows={3}
              className="w-full bg-[var(--aeva-bg)] text-white border border-[var(--aeva-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--aeva-blue)] transition-all resize-none placeholder-[var(--aeva-text-muted)]" />
            <div className="flex items-center gap-3">
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="bg-[var(--aeva-surface)] text-[var(--aeva-text-dim)] border border-[var(--aeva-border)] rounded-lg px-3 py-2 text-xs focus:outline-none">
                {["vision","project","research","feature"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" disabled={submitting}
                className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                {submitting ? "Saving…" : "💾 Save Idea"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-[var(--aeva-text-muted)] text-xs hover:text-white transition-colors">Cancel</button>
            </div>
          </form>
        )}

        {loading && <div className="text-[var(--aeva-text-dim)] text-center py-20 animate-in">Loading…</div>}

        {!loading && (
          <div className="space-y-3">
            {displayed.length === 0 && ideas.length > 0 && (
              <div className="text-center text-[var(--aeva-text-muted)] py-8">No ideas match the current filters.</div>
            )}
            {displayed.map((idea, i) => {
              const cc = CAT_COLOR[idea.category ?? ''] ?? CAT_COLOR.research;
              const sc = STATUS_COLOR[idea.status ?? ''] ?? STATUS_COLOR.new;
              return (
                <div key={idea.id} className="card-glow p-5 animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h2 className="text-white font-semibold text-sm">{idea.title}</h2>
                        {idea.category && <span className={`text-[10px] px-2 py-0.5 rounded-full border ${cc.bg} ${cc.text} ${cc.border}`}>{idea.category}</span>}
                        {idea.status && <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>{idea.status}</span>}
                      </div>
                      {idea.description && <p className="text-[var(--aeva-text-dim)] text-xs mt-1">{idea.description}</p>}
                      {idea.tags && idea.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {idea.tags.map(tag => (
                            <span key={tag} className="text-[10px] text-[var(--aeva-text-muted)] bg-[var(--aeva-surface-2)] px-2 py-0.5 rounded-full border border-[var(--aeva-border)]">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-[10px] text-[var(--aeva-text-muted)] shrink-0 space-y-1">
                      <div className="font-mono">{idea.id}</div>
                      <div>{timeAgo(idea.capturedAt)}</div>
                      {idea.notionUrl && (
                        <a href={idea.notionUrl} target="_blank" rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 inline-block">Notion ↗</a>
                      )}
                      <button onClick={() => router.push(`/tasks?title=${encodeURIComponent(idea.title)}&description=${encodeURIComponent(idea.description ?? "")}`)}
                        className="block text-green-400 hover:text-green-300 hover:underline transition-colors">
                        → Create Task
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {ideas.length === 0 && (
              <div className="text-center text-[var(--aeva-text-muted)] py-16 card-glow">
                No ideas captured yet. Click &ldquo;Capture Idea&rdquo; to add one.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
