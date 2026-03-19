"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";
const REFRESH_INTERVAL = 30_000;

interface Summary {
  generatedAt: string;
  tasks: {
    total: number; done: number; inProgress: number; blocked: number; ready: number;
    completionRate: number; velocity7d: number;
    recentCompletions: Array<{ id: string; title: string; completedAt?: string }>;
  };
  agents: {
    active: number; activeList: string[];
    topContributors: Array<{ name: string; tasks: number }>;
  };
  activity: { last7d: number; total: number };
  projects: { distribution: Array<{ project: string; tasks: number }> };
}

interface Alert { id: string; level: "warning" | "critical"; type: string; title: string; message: string; }

function Ring({ pct, color, label, sub }: { pct: number; color: string; label: string; sub: string }) {
  const r = 36, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="#374151" strokeWidth="8" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 45 45)" />
        <text x="45" y="50" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">{pct}%</text>
      </svg>
      <p className="text-white text-sm font-semibold">{label}</p>
      <p className="text-gray-500 text-xs">{sub}</p>
    </div>
  );
}

function BarRow({ label, value, max, colorClass }: { label: string; value: number; max: number; colorClass: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-300 w-28 truncate capitalize">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-2">
        <div className={`${colorClass} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-gray-400 w-8 text-right font-mono">{value}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const timer = useRef<NodeJS.Timeout | null>(null);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [sumRes, alertRes] = await Promise.allSettled([
      fetch(`${API}/api/analytics/summary`).then(r => r.json()),
      fetch(`${API}/api/alerts`).then(r => r.json()),
    ]);
    if (sumRes.status === "fulfilled") setSummary(sumRes.value);
    if (alertRes.status === "fulfilled") setAlerts(alertRes.value.alerts ?? []);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    timer.current = setInterval(() => fetchAll(true), REFRESH_INTERVAL);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [fetchAll]);

  const t = summary?.tasks;
  const maxProject = Math.max(...(summary?.projects.distribution.map(p => p.tasks) ?? [1]));
  const maxContrib  = Math.max(...(summary?.agents.topContributors.map(c => c.tasks) ?? [1]));

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div>
            <h1 className="text-3xl font-bold text-white">📊 Analytics</h1>
            <p className="text-gray-400 mt-1 text-sm">
              Auto-refreshes every 30s · last update {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <button onClick={() => fetchAll(true)} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">🔄 Refresh</button>
        </div>

        {loading ? (
          <div className="text-gray-400 text-center py-20">Loading analytics…</div>
        ) : (
          <>
            {/* Alerts strip */}
            {alerts.length > 0 && (
              <div className="mb-6 space-y-2">
                {alerts.slice(0, 3).map(a => (
                  <div key={a.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm ${
                    a.level === "critical" ? "bg-red-950 border-red-700 text-red-200" : "bg-yellow-950 border-yellow-700 text-yellow-200"
                  }`}>
                    <span>{a.level === "critical" ? "🔴" : "⚠️"}</span>
                    <span className="font-medium">{a.title}</span>
                    <span className="opacity-70 ml-1 hidden sm:inline">{a.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Ring gauges */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6 flex flex-wrap justify-around gap-8">
              <Ring pct={t?.completionRate ?? 0} color="#10b981" label="Completion Rate" sub={`${t?.done ?? 0} / ${t?.total ?? 0} tasks done`} />
              <Ring pct={t && t.total > 0 ? Math.round(((t.inProgress) / t.total) * 100) : 0} color="#3b82f6" label="In Progress" sub={`${t?.inProgress ?? 0} active tasks`} />
              <Ring pct={t && t.total > 0 ? Math.round(((t.blocked) / t.total) * 100) : 0} color="#ef4444" label="Blocked Rate" sub={`${t?.blocked ?? 0} blocked`} />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Velocity (7d)", value: t?.velocity7d ?? 0, icon: "⚡", color: "text-blue-400" },
                { label: "Total Tasks", value: t?.total ?? 0, icon: "📋", color: "text-white" },
                { label: "Active Agents", value: summary?.agents.active ?? 0, icon: "🤖", color: "text-green-400" },
                { label: "Activity (7d)", value: summary?.activity.last7d ?? 0, icon: "📡", color: "text-purple-400" },
              ].map(s => (
                <div key={s.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-gray-500 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Top contributors */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-white font-semibold mb-4">🏆 Top Contributors</h2>
                <div className="space-y-3">
                  {summary?.agents.topContributors.map(c => (
                    <BarRow key={c.name} label={c.name} value={c.tasks} max={maxContrib} colorClass="bg-blue-500" />
                  ))}
                  {!summary?.agents.topContributors.length && <p className="text-gray-600 text-sm">No data</p>}
                </div>
              </div>

              {/* Project distribution */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-white font-semibold mb-4">🚀 Tasks by Project</h2>
                <div className="space-y-3">
                  {summary?.projects.distribution.map(p => (
                    <BarRow key={p.project} label={p.project} value={p.tasks} max={maxProject} colorClass="bg-purple-500" />
                  ))}
                  {!summary?.projects.distribution.length && <p className="text-gray-600 text-sm">No data</p>}
                </div>
              </div>
            </div>

            {/* Recent completions + active agents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-white font-semibold mb-4">✅ Recent Completions</h2>
                <div className="space-y-2">
                  {summary?.tasks.recentCompletions.map(c => (
                    <div key={c.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-800 last:border-0">
                      <div>
                        <span className="text-gray-500 text-xs mr-2">{c.id}</span>
                        <span className="text-gray-300">{c.title}</span>
                      </div>
                      <span className="text-gray-600 text-xs shrink-0">
                        {c.completedAt ? new Date(c.completedAt).toLocaleDateString() : "—"}
                      </span>
                    </div>
                  ))}
                  {!summary?.tasks.recentCompletions.length && <p className="text-gray-600 text-sm">No completions yet</p>}
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-white font-semibold mb-4">🤖 Active Agents</h2>
                <div className="space-y-2">
                  {summary?.agents.activeList.map(name => (
                    <div key={name} className="flex items-center gap-2 py-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-gray-300 capitalize">{name}</span>
                    </div>
                  ))}
                  {!summary?.agents.activeList.length && (
                    <p className="text-gray-600 text-sm">No active agents</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
