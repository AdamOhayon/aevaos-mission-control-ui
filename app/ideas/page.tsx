"use client";
import { useState, useEffect, useCallback, FormEvent } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";

const CATEGORY_BADGE: Record<string, string> = {
  vision:   "bg-purple-900 text-purple-300",
  project:  "bg-blue-900 text-blue-300",
  research: "bg-teal-900 text-teal-300",
  feature:  "bg-orange-900 text-orange-300",
};

const STATUS_BADGE: Record<string, string> = {
  "in-progress": "bg-blue-900 text-blue-300",
  documented:    "bg-green-900 text-green-300",
  new:           "bg-yellow-900 text-yellow-300",
};

interface Idea {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status?: string;
  source?: string;
  capturedAt?: string;
  tags?: string[];
  notionUrl?: string;
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("research");
  const [submitting, setSubmitting] = useState(false);

  const fetchIdeas = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/ideas`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setIdeas(data.ideas ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  async function handleCapture(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: desc, category, source: "mission-control-ui" }),
      });
      if (res.ok) {
        setTitle(""); setDesc(""); setCategory("research"); setShowForm(false);
        fetchIdeas();
      }
    } finally {
      setSubmitting(false);
    }
  }

  function timeAgo(ts?: string) {
    if (!ts) return "—";
    const diff = Date.now() - new Date(ts).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">💡 Ideas</h1>
            <p className="text-gray-400 mt-1">{ideas.length} captured ideas</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Capture Idea
          </button>
        </div>

        {/* Capture form */}
        {showForm && (
          <form onSubmit={handleCapture} className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-6 space-y-3">
            <h2 className="text-white font-semibold">New Idea</h2>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Idea title…"
              required
              className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe the idea…"
              rows={3}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
            <div className="flex items-center gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                {["vision","project","research","feature"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {submitting ? "Saving…" : "Save Idea"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 text-sm hover:text-gray-300">
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading && <div className="text-gray-400 text-center py-20">Loading…</div>}
        {error && <div className="text-red-400 text-center py-20">Error: {error}</div>}

        {!loading && !error && (
          <div className="space-y-3">
            {ideas.map((idea) => (
              <div key={idea.id} className="bg-gray-900 rounded-xl border border-gray-800 p-5 hover:border-gray-600 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-white font-semibold">{idea.title}</h2>
                      {idea.category && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_BADGE[idea.category] ?? "bg-gray-800 text-gray-300"}`}>
                          {idea.category}
                        </span>
                      )}
                      {idea.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[idea.status] ?? "bg-gray-800 text-gray-300"}`}>
                          {idea.status}
                        </span>
                      )}
                    </div>
                    {idea.description && (
                      <p className="text-gray-400 text-sm mt-1">{idea.description}</p>
                    )}
                    {idea.tags && idea.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {idea.tags.map((tag) => (
                          <span key={tag} className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500 shrink-0">
                    <div>{idea.id}</div>
                    <div>{timeAgo(idea.capturedAt)}</div>
                    {idea.notionUrl && (
                      <a href={idea.notionUrl} target="_blank" rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 mt-1 inline-block">Notion ↗</a>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {ideas.length === 0 && (
              <div className="text-center text-gray-600 py-16 border border-dashed border-gray-800 rounded-xl">
                No ideas captured yet. Click "Capture Idea" to add one.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
