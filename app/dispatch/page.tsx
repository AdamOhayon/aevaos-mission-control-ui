'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-194a.up.railway.app';

interface Classification { task_type: string; complexity: number; confidence: number; signals: string[]; }
interface DispatchResult { dispatch_id: string; agent: string; model: string; classification: Classification; response: string; status: string; latency_ms: number; thread_id: string; }
interface HistoryItem { dispatch_id?: string; agent: string; input_message: string; status: string; timestamp?: string; classification?: { type?: string; task_type?: string }; }

const AGENT_META: Record<string, { emoji: string; color: string; label: string }> = {
  aeva:  { emoji: '🌀', color: '#8b5cf6', label: 'Aeva' },
  clara: { emoji: '👩‍💻', color: '#3b82f6', label: 'Clara' },
  pixel: { emoji: '🎨', color: '#ec4899', label: 'Pixel' },
  sage:  { emoji: '🔍', color: '#10b981', label: 'Sage' },
};

export default function DispatchPage() {
  const [message, setMessage]     = useState('');
  const [context, setContext]     = useState('');
  const [sending, setSending]     = useState(false);
  const [result, setResult]       = useState<DispatchResult | null>(null);
  const [history, setHistory]     = useState<HistoryItem[]>([]);
  const [rating, setRating]       = useState(0);
  const [ratingNote, setRatingNote] = useState('');
  const [ratingSent, setRatingSent] = useState(false);
  const [showCtx, setShowCtx]     = useState(false);
  const [typedResponse, setTypedResponse] = useState('');
  const responseRef = useRef<HTMLDivElement>(null);

  // Typewriter effect for response
  useEffect(() => {
    if (!result?.response) { setTypedResponse(''); return; }
    setTypedResponse('');
    let i = 0;
    const text = result.response;
    const interval = setInterval(() => {
      i++;
      setTypedResponse(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 8);
    return () => clearInterval(interval);
  }, [result?.response]);

  // Auto-scroll response
  useEffect(() => {
    if (responseRef.current) responseRef.current.scrollTop = responseRef.current.scrollHeight;
  }, [typedResponse]);

  // Fetch history
  async function fetchHistory() {
    try {
      const res = await fetch(`${API}/api/agents/dispatch/history?limit=10`);
      const data = await res.json();
      setHistory(data.dispatches ?? []);
    } catch { /* silent */ }
  }
  useEffect(() => { fetchHistory(); }, []);

  async function handleDispatch(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setResult(null);
    setRating(0);
    setRatingSent(false);
    setRatingNote('');
    try {
      let ctx = {};
      if (context.trim()) try { ctx = JSON.parse(context); } catch { ctx = { raw: context }; }
      const res = await fetch(`${API}/api/agents/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context: ctx }),
      });
      const data = await res.json();
      setResult(data);
      fetchHistory();
    } catch { /* silent */ }
    finally { setSending(false); }
  }

  async function sendRating() {
    if (!result?.dispatch_id || rating < 1) return;
    try {
      await fetch(`${API}/api/agents/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispatch_id: result.dispatch_id, rating, note: ratingNote }),
      });
      setRatingSent(true);
    } catch { /* silent */ }
  }

  const agentInfo = result ? AGENT_META[result.agent] ?? AGENT_META.aeva : null;

  return (
    <div className="min-h-screen bg-[var(--aeva-bg)] pt-16 grid-bg">
      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">

        {/* Header */}
        <div className="mb-8 animate-in">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">⚡</span>
            <h1 className="text-3xl font-bold text-white">Dispatch Terminal</h1>
          </div>
          <p className="text-[var(--aeva-text-dim)] text-sm ml-12">Route tasks to specialized agents · Aeva handles triage automatically</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main dispatch area */}
          <div className="lg:col-span-2 space-y-4">

            {/* Input form — terminal style */}
            <div className="card-glow overflow-hidden animate-in animate-in-delay-1">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--aeva-border)] bg-[var(--aeva-surface-2)]">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                <span className="text-[10px] text-[var(--aeva-text-muted)] ml-2 font-mono">dispatch://aeva-mesh</span>
              </div>
              <form onSubmit={handleDispatch} className="p-4 space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-400 text-xs font-mono">$</span>
                    <span className="text-[var(--aeva-text-muted)] text-xs font-mono">dispatch.send(</span>
                  </div>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Describe the task to dispatch..."
                    className="w-full bg-[var(--aeva-bg)] text-green-300 border border-[var(--aeva-border)] rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-green-500/50 focus:shadow-[0_0_12px_rgba(16,185,129,0.1)] transition-all placeholder-[var(--aeva-text-muted)] resize-none"
                  />
                </div>

                {/* Context toggle */}
                <div>
                  <button type="button" onClick={() => setShowCtx(!showCtx)}
                    className="text-[var(--aeva-text-muted)] text-[10px] font-mono hover:text-[var(--aeva-text-dim)] transition-colors">
                    {showCtx ? '▼' : '▶'} context = {'{'}...{'}'}
                  </button>
                  {showCtx && (
                    <textarea
                      value={context}
                      onChange={e => setContext(e.target.value)}
                      rows={3}
                      placeholder='{"project": "aevaos-api", "files": ["app.py"]}'
                      className="w-full mt-2 bg-[var(--aeva-bg)] text-cyan-300 border border-[var(--aeva-border)] rounded-lg px-4 py-3 text-xs font-mono focus:outline-none focus:border-cyan-500/50 transition-all placeholder-[var(--aeva-text-muted)] resize-none"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--aeva-text-muted)] text-xs font-mono">)</span>
                  <button type="submit" disabled={sending || !message.trim()}
                    className="px-5 py-2 bg-green-600/20 hover:bg-green-600/30 disabled:bg-[var(--aeva-surface)] disabled:text-[var(--aeva-text-muted)] text-green-400 border border-green-500/30 font-mono text-sm font-medium rounded-lg transition-all hover:shadow-[0_0_16px_rgba(16,185,129,0.12)]">
                    {sending ? '⟳ dispatching...' : '→ dispatch'}
                  </button>
                </div>
              </form>
            </div>

            {/* Result */}
            {result && (
              <div className="card-glow overflow-hidden animate-in">
                {/* Result header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--aeva-border)] bg-[var(--aeva-surface-2)]">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{agentInfo?.emoji}</span>
                    <div>
                      <span className="text-white font-semibold text-sm">{agentInfo?.label}</span>
                      <span className="text-[var(--aeva-text-muted)] text-xs ml-2 font-mono">{result.model?.split('/').pop()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      result.status === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>{result.status}</span>
                    {result.latency_ms && <span className="text-[var(--aeva-text-muted)] text-[10px] font-mono">{(result.latency_ms / 1000).toFixed(1)}s</span>}
                  </div>
                </div>

                {/* Classification badges */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--aeva-border)] bg-[var(--aeva-surface)]/50 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">{result.classification?.task_type}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">complexity: {result.classification?.complexity}/10</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">confidence: {Math.round((result.classification?.confidence ?? 0) * 100)}%</span>
                  {result.classification?.signals?.slice(0, 3).map((s, i) => (
                    <span key={i} className="text-[10px] text-[var(--aeva-text-muted)]">#{s}</span>
                  ))}
                </div>

                {/* Response with typewriter */}
                <div ref={responseRef} className="p-4 max-h-[400px] overflow-y-auto">
                  <pre className="text-[var(--aeva-text)] text-sm font-mono whitespace-pre-wrap leading-relaxed">
                    {typedResponse}
                    {typedResponse.length < (result.response?.length ?? 0) && <span className="typewriter-cursor">&nbsp;</span>}
                  </pre>
                </div>

                {/* Feedback */}
                <div className="px-4 py-3 border-t border-[var(--aeva-border)] bg-[var(--aeva-surface-2)]">
                  {!ratingSent ? (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[var(--aeva-text-muted)] text-[10px] uppercase tracking-wider">Rate:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} onClick={() => setRating(s)}
                            className={`text-lg transition-all duration-150 hover:scale-125 ${s <= rating ? 'opacity-100' : 'opacity-20'}`}>
                            ⭐
                          </button>
                        ))}
                      </div>
                      {rating > 0 && (
                        <>
                          <input
                            type="text" value={ratingNote} onChange={e => setRatingNote(e.target.value)}
                            placeholder="Optional note..."
                            className="flex-1 min-w-0 bg-[var(--aeva-bg)] text-[var(--aeva-text)] border border-[var(--aeva-border)] rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[var(--aeva-blue)]"
                          />
                          <button onClick={sendRating}
                            className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-mono hover:bg-blue-600/30 transition-colors">
                            Submit
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-green-400 text-xs font-mono">✓ Feedback logged — Aeva will learn from this</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — history */}
          <div className="animate-in animate-in-delay-2">
            <h2 className="text-[var(--aeva-text-muted)] text-[10px] uppercase tracking-[0.2em] font-semibold mb-3">Dispatch History</h2>
            <div className="space-y-2">
              {history.length === 0 && (
                <div className="card-glow p-6 text-center text-[var(--aeva-text-muted)] text-xs">No dispatches yet</div>
              )}
              {history.map((h, i) => {
                const meta = AGENT_META[h.agent] ?? AGENT_META.aeva;
                return (
                  <div key={i} className="card-glow p-3 animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{meta.emoji}</span>
                      <span className="text-xs font-medium" style={{ color: meta.color }}>{meta.label}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ml-auto ${h.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`} />
                    </div>
                    <p className="text-[var(--aeva-text)] text-xs truncate">{h.input_message}</p>
                    {(h.classification?.type || h.classification?.task_type) && (
                      <span className="text-[var(--aeva-text-muted)] text-[10px] font-mono">{h.classification.type ?? h.classification.task_type}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
