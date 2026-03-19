'use client';

import { useState, useEffect, useRef } from 'react';

interface Activity {
  timestamp: string;
  agent: string;
  action: string;
  message: string;
  metadata?: Record<string, string>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-194a.up.railway.app';

const AGENT_BADGE: Record<string, string> = {
  aeva:          'bg-blue-900 text-blue-200',
  clara:         'bg-purple-900 text-purple-200',
  system:        'bg-gray-700 text-gray-300',
  antigravity:   'bg-indigo-900 text-indigo-200',
  ui:            'bg-teal-900 text-teal-200',
};

const ACTION_ICON: Record<string, string> = {
  task_started:     '▶️',  task_in_progress: '▶️',
  task_completed:   '✅',  task_done:        '✅',
  task_blocked:     '🚫',  task_created:     '🆕',
  system_init:      '🔧',  message:          '💬',
  collaboration:    '🤝',  decision:         '🎯',
  error:            '❌',  deployment:       '🚀',
  idea_captured:    '💡',
};

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [live, setLive]             = useState(false);
  const scrollRef    = useRef<HTMLDivElement>(null);
  const prevLenRef   = useRef(0);
  const eventSrcRef  = useRef<EventSource | null>(null);

  // --- Initial load via REST ---
  async function fetchInitial() {
    try {
      const res = await fetch(`${API_URL}/api/office/activity?limit=50`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data: Activity[] = await res.json();
      setActivities(data);
      prevLenRef.current = data.length;
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  // --- SSE upgrade (falls back to polling if SSE fails) ---
  function connectSSE() {
    try {
      const es = new EventSource(`${API_URL}/api/stream/activity`);
      eventSrcRef.current = es;

      es.onopen = () => setLive(true);
      es.onmessage = (event) => {
        try {
          const entry: Activity = JSON.parse(event.data);
          setActivities(prev => {
            const next = [...prev, entry];
            return next.slice(-100); // keep last 100
          });
          // Auto-scroll
          setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }
          }, 80);
        } catch { /* ignore parse errors */ }
      };

      es.onerror = () => {
        setLive(false);
        es.close();
        eventSrcRef.current = null;
        // Fall back to polling
        setTimeout(() => startPolling(), 5000);
      };
    } catch {
      startPolling();
    }
  }

  // --- Polling fallback ---
  const pollTimer = useRef<NodeJS.Timeout | null>(null);
  function startPolling() {
    if (pollTimer.current) return;
    pollTimer.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/office/activity?limit=50`);
        if (!res.ok) return;
        const data: Activity[] = await res.json();
        setActivities(data);
        if (data.length > prevLenRef.current && scrollRef.current) {
          scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
        prevLenRef.current = data.length;
      } catch { /* noop */ }
    }, 8000);
  }

  useEffect(() => {
    fetchInitial().then(() => connectSSE());
    return () => {
      eventSrcRef.current?.close();
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fmt(ts: string) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 flex flex-col" style={{ height: '500px' }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">📡</span>
          <span className="text-white font-semibold">Activity Feed</span>
          <span className="text-gray-600 text-xs">{activities.length} events</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${live ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
          <span className={`text-xs ${live ? 'text-green-400' : 'text-gray-500'}`}>
            {live ? 'live' : 'polling'}
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        )}
        {error && <div className="text-red-400 text-sm text-center py-8">Error: {error}</div>}
        {!loading && !error && activities.length === 0 && (
          <div className="text-gray-600 text-sm text-center py-8">No activity yet</div>
        )}
        {activities.map((act, i) => (
          <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-800 last:border-0 hover:bg-gray-800/50 rounded px-1 transition-colors">
            <span className="text-lg shrink-0 w-6 text-center">{ACTION_ICON[act.action] ?? '📌'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded shrink-0 ${AGENT_BADGE[act.agent?.toLowerCase()] ?? 'bg-gray-700 text-gray-300'}`}>
                  {act.agent}
                </span>
                <span className="text-xs text-gray-600 shrink-0">{fmt(act.timestamp)}</span>
              </div>
              <p className="text-gray-300 text-sm leading-snug">{act.message}</p>
              {act.metadata && Object.keys(act.metadata).length > 0 && (
                <div className="flex gap-3 mt-1">
                  {Object.entries(act.metadata).slice(0, 3).map(([k, v]) => (
                    <span key={k} className="text-xs text-gray-600">
                      <span className="font-medium">{k}:</span> {String(v)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
