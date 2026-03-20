'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-194a.up.railway.app';

const AGENT_META: Record<string, { emoji: string; color: string; bg: string }> = {
  aeva:     { emoji: '🌀', color: 'text-purple-400',  bg: 'bg-purple-950 border-purple-800' },
  clara:    { emoji: '👩‍💻', color: 'text-blue-400',    bg: 'bg-blue-950 border-blue-800' },
  pixel:    { emoji: '🎨', color: 'text-pink-400',    bg: 'bg-pink-950 border-pink-800' },
  sage:     { emoji: '🔍', color: 'text-green-400',   bg: 'bg-green-950 border-green-800' },
  default:  { emoji: '🤖', color: 'text-gray-400',    bg: 'bg-gray-900 border-gray-700' },
};

const TYPE_BADGE: Record<string, string> = {
  coding:       'bg-blue-900 text-blue-300',
  design:       'bg-pink-900 text-pink-300',
  research:     'bg-green-900 text-green-300',
  coordination: 'bg-yellow-900 text-yellow-300',
  general:      'bg-gray-800 text-gray-400',
};
const COMPLEXITY_BADGE: Record<string, string> = {
  low:    'bg-green-900 text-green-300',
  medium: 'bg-yellow-900 text-yellow-300',
  high:   'bg-red-900 text-red-300',
};

interface Classification {
  type: string;
  complexity: string;
  confidence: number;
  signals?: string[];
}
interface Dispatch {
  id?: string;
  dispatch_id?: string;
  thread_id?: string;
  timestamp?: string;
  input_message: string;
  classification?: Classification;
  agent: string;
  model: string;
  response: string;
  latency_ms?: number;
  status: string;
  error?: string;
  feedback?: { rating: number | null; note: string | null } | null;
}

export default function DispatchPage() {
  const [message, setMessage]         = useState('');
  const [context, setContext]         = useState('');
  const [threadId, setThreadId]       = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [result, setResult]           = useState<Dispatch | null>(null);
  const [history, setHistory]         = useState<Dispatch[]>([]);
  const [historyLoading, setHL]       = useState(true);
  const [feedbackId, setFeedbackId]   = useState('');
  const [feedbackRating, setRating]   = useState(5);
  const [feedbackNote, setFNNote]     = useState('');
  const [feedbackDone, setFDone]      = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/agents/dispatch/history?limit=30`);
      const data = await res.json();
      setHistory(data.dispatches ?? []);
    } catch { /* silent */ } finally {
      setHL(false);
    }
  }, []);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    fetchHistory();
    timerRef.current = setInterval(fetchHistory, 30_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchHistory]);

  async function handleDispatch(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setDispatching(true);
    setResult(null);
    try {
      const body: Record<string, unknown> = { message };
      if (context.trim()) {
        try { body.context = JSON.parse(context); }
        catch { body.context = { custom: context }; }
      }
      if (threadId.trim()) body.thread_id = threadId;

      const res = await fetch(`${API}/api/agents/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResult(data);
      setFeedbackId(data.dispatch_id ?? data.id ?? '');
      setFDone(false);
      fetchHistory();
    } finally {
      setDispatching(false);
    }
  }

  async function submitFeedback() {
    if (!feedbackId) return;
    await fetch(`${API}/api/agents/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dispatch_id: feedbackId, rating: feedbackRating, note: feedbackNote }),
    });
    setFDone(true);
  }

  const agentStyle = (agent: string) => AGENT_META[agent] ?? AGENT_META.default;

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">⚡ Dispatch Console</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Send a message — the triage engine classifies it, picks the best agent + model, and runs it.
          </p>
        </div>

        {/* Agent mesh overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Object.entries(AGENT_META).filter(([k]) => k !== 'default').map(([id, meta]) => (
            <div key={id} className={`${meta.bg} border rounded-xl p-3 text-center`}>
              <div className="text-2xl mb-1">{meta.emoji}</div>
              <div className={`text-sm font-medium capitalize ${meta.color}`}>{id}</div>
            </div>
          ))}
        </div>

        {/* Dispatch form */}
        <form onSubmit={handleDispatch} className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 space-y-4">
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wide block mb-1.5">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              placeholder="Describe the task… e.g. 'Fix the bug in the credits refresh', 'Design the dashboard header', 'Research MCP protocol vs ACP'"
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wide block mb-1.5">Context (optional JSON or plain text)</label>
              <textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                rows={2}
                placeholder={`{"project": "aevaos-api", "relevant_files": ["app.py"]}`}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none font-mono"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wide block mb-1.5">Thread ID (optional, for continuity)</label>
              <input
                type="text"
                value={threadId}
                onChange={e => setThreadId(e.target.value)}
                placeholder="Leave blank to start new thread"
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={dispatching || !message.trim()}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {dispatching ? (
              <><span className="animate-spin">⟳</span> Dispatching…</>
            ) : (
              '⚡ Dispatch'
            )}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className={`${agentStyle(result.agent).bg} border rounded-xl p-5 mb-6`}>
            <div className="flex items-start gap-3 mb-4">
              <span className="text-3xl">{agentStyle(result.agent).emoji}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`font-bold text-lg capitalize ${agentStyle(result.agent).color}`}>{result.agent}</span>
                  <span className="text-gray-500 text-xs">via {result.model}</span>
                  {result.latency_ms && <span className="text-gray-600 text-xs">{result.latency_ms}ms</span>}
                  {result.status === 'dry_run' && <span className="text-yellow-400 text-xs bg-yellow-950 px-2 py-0.5 rounded">DRY RUN</span>}
                  {result.status === 'error' && <span className="text-red-400 text-xs bg-red-950 px-2 py-0.5 rounded">ERROR</span>}
                </div>
                {result.classification && (
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[result.classification.type] ?? 'bg-gray-800 text-gray-400'}`}>
                      {result.classification.type}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${COMPLEXITY_BADGE[result.classification.complexity] ?? 'bg-gray-800 text-gray-400'}`}>
                      {result.classification.complexity} complexity
                    </span>
                    <span className="text-xs text-gray-600">{Math.round((result.classification.confidence ?? 0) * 100)}% confidence</span>
                    {result.classification.signals?.length ? (
                      <span className="text-xs text-gray-700">signals: {result.classification.signals.slice(0, 4).join(', ')}</span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-950/60 rounded-lg p-4 text-sm text-gray-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
              {result.response}
            </div>

            {/* Feedback */}
            {!feedbackDone ? (
              <div className="mt-4 border-t border-gray-700 pt-4">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Rate this response (helps Aeva self-improve)</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setRating(n)}
                        className={`w-7 h-7 rounded text-sm transition-colors ${feedbackRating >= n ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>
                        ★
                      </button>
                    ))}
                  </div>
                  <input type="text" value={feedbackNote} onChange={e => setFNNote(e.target.value)}
                    placeholder="Optional note (e.g. 'routing was wrong, should be Clara')"
                    className="flex-1 min-w-48 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-blue-500" />
                  <button onClick={submitFeedback}
                    className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded-lg text-sm transition-colors">
                    Submit
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-green-400 text-sm">✓ Feedback logged — Aeva will learn from this.</p>
            )}
          </div>
        )}

        {/* History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold">Dispatch History</h2>
            <button onClick={fetchHistory} className="text-gray-500 text-sm hover:text-gray-300">🔄 Refresh</button>
          </div>
          {historyLoading && <div className="text-gray-500 text-center py-8">Loading…</div>}
          <div className="space-y-2">
            {history.map((d, i) => {
              const meta = agentStyle(d.agent);
              return (
                <div key={d.dispatch_id ?? d.id ?? i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-sm font-medium capitalize ${meta.color}`}>{d.agent}</span>
                        <span className="text-gray-600 text-xs">{d.model}</span>
                        {d.classification?.type && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${TYPE_BADGE[d.classification.type] ?? ''}`}>{d.classification.type}</span>
                        )}
                        {d.status === 'error' && <span className="text-red-400 text-xs">ERROR</span>}
                        {d.status === 'dry_run' && <span className="text-yellow-500 text-xs">DRY RUN</span>}
                        {d.latency_ms && <span className="text-gray-700 text-xs">{d.latency_ms}ms</span>}
                        <span className="text-gray-700 text-xs ml-auto">{d.timestamp ? new Date(d.timestamp).toLocaleString() : ''}</span>
                      </div>
                      <p className="text-gray-400 text-sm truncate">{d.input_message}</p>
                      {d.feedback?.rating && (
                        <span className="text-yellow-500 text-xs">{'★'.repeat(d.feedback.rating)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {!historyLoading && history.length === 0 && (
              <div className="text-center text-gray-600 py-12 border border-dashed border-gray-800 rounded-xl">
                No dispatches yet — send your first message above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
