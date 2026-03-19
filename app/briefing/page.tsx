"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";
const REFRESH = 60_000;

interface Briefing {
  generatedAt: string;
  period: string;
  date: string;
  headline: string;
  highlights: string[];
  taskSummary: {
    total: number; done: number; active: number;
    blocked: number; ready: number; velocity7d: number;
    recentlyCompleted: Array<{ id: string; title: string }>;
  };
  agentSummary: {
    total: number; active: number;
    agents: Array<{ name: string; status: string; currentTask?: string }>;
  };
  projectSummary: {
    active: number; atRisk: number;
    projects: Array<{ name: string; health: string; status: string }>;
  };
  activity24h: number;
  alerts: Array<{ level: string; message: string }>;
}

const HEALTH_COLOR: Record<string, string> = {
  green: "text-green-400", yellow: "text-yellow-400", red: "text-red-400", unknown: "text-gray-400",
};
const STATUS_DOT: Record<string, string> = {
  active: "bg-green-400 animate-pulse", busy: "bg-yellow-400 animate-pulse", idle: "bg-gray-500",
};

export default function BriefingPage() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const timer = useRef<NodeJS.Timeout | null>(null);

  const fetchBriefing = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API}/api/briefing`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setBriefing(await res.json());
      setError(null);
      setLastRefresh(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load briefing");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefing();
    timer.current = setInterval(() => fetchBriefing(true), REFRESH);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [fetchBriefing]);

  const t = briefing?.taskSummary;
  const totalTasks = t?.total ?? 0;

  function pct(n: number) {
    return totalTasks > 0 ? Math.round((n / totalTasks) * 100) : 0;
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div>
            <h1 className="text-3xl font-bold text-white">📋 Daily Briefing</h1>
            <p className="text-gray-400 mt-1 text-sm">
              {briefing?.headline ?? "Loading situational awareness…"} · refreshed {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <button onClick={() => fetchBriefing(true)} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">
            🔄 Refresh
          </button>
        </div>

        {loading && <div className="text-gray-400 text-center py-20">Generating briefing…</div>}
        {error && <div className="text-red-400 text-center py-20">Error: {error}</div>}

        {briefing && !loading && (
          <div className="space-y-5">

            {/* Alerts strip */}
            {briefing.alerts.length > 0 && (
              <div className="space-y-2">
                {briefing.alerts.map((a, i) => (
                  <div key={i} className={`flex items-start gap-2 px-4 py-3 rounded-lg border text-sm ${
                    a.level === "critical" ? "bg-red-950 border-red-700 text-red-200" : "bg-yellow-950 border-yellow-700 text-yellow-200"
                  }`}>
                    <span>{a.level === "critical" ? "🔴" : "⚠️"}</span>
                    <span>{a.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Highlights */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h2 className="text-white font-semibold mb-3 text-lg">✨ Highlights</h2>
              {briefing.highlights.length > 0 ? (
                <ul className="space-y-2">
                  {briefing.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                      <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                      {h}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">All systems nominal. Nothing needs your attention.</p>
              )}
            </div>

            {/* Task summary */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h2 className="text-white font-semibold mb-4 text-lg">✅ Task Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
                {[
                  { label: "Total",       value: t?.total ?? 0,       color: "text-white" },
                  { label: "Done",        value: t?.done ?? 0,        color: "text-green-400" },
                  { label: "Active",      value: t?.active ?? 0,      color: "text-blue-400" },
                  { label: "Blocked",     value: t?.blocked ?? 0,     color: "text-red-400" },
                  { label: "Velocity 7d", value: t?.velocity7d ?? 0,  color: "text-purple-400" },
                ].map(s => (
                  <div key={s.label} className="bg-gray-800 rounded-lg p-3 text-center">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-gray-500 text-xs mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Completion</span>
                  <span>{pct(t?.done ?? 0)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden flex">
                  <div className="bg-green-500 h-full transition-all" style={{ width: `${pct(t?.done ?? 0)}%` }} />
                  <div className="bg-blue-500 h-full transition-all" style={{ width: `${pct(t?.active ?? 0)}%` }} />
                  <div className="bg-red-500 h-full transition-all" style={{ width: `${pct(t?.blocked ?? 0)}%` }} />
                </div>
                <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500 inline-block" />Done</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500 inline-block" />Active</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500 inline-block" />Blocked</span>
                </div>
              </div>

              {t?.recentlyCompleted && t.recentlyCompleted.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Completed last 24h</p>
                  <div className="space-y-1">
                    {t.recentlyCompleted.map(c => (
                      <div key={c.id} className="flex items-center gap-2 text-sm">
                        <span className="text-green-400">✓</span>
                        <span className="text-gray-500 text-xs">{c.id}</span>
                        <span className="text-gray-300">{c.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Agents + Projects side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-white font-semibold mb-3 text-lg">🤖 Agents</h2>
                <div className="space-y-3">
                  {briefing.agentSummary.agents.map((agent, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${STATUS_DOT[agent.status] ?? "bg-gray-600"}`} />
                      <div>
                        <p className="text-gray-200 text-sm font-medium">{agent.name}</p>
                        {agent.currentTask && (
                          <p className="text-gray-500 text-xs">→ {agent.currentTask}</p>
                        )}
                        {!agent.currentTask && (
                          <p className="text-gray-600 text-xs capitalize">{agent.status}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {briefing.agentSummary.agents.length === 0 && (
                    <p className="text-gray-600 text-sm">No agents registered</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-white font-semibold mb-3 text-lg">🚀 Active Projects</h2>
                <div className="space-y-3">
                  {briefing.projectSummary.projects.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">{p.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${HEALTH_COLOR[p.health ?? "unknown"]}`}>
                          {p.health === "green" ? "●" : p.health === "yellow" ? "●" : p.health === "red" ? "●" : "○"} {p.health ?? "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                  {briefing.projectSummary.projects.length === 0 && (
                    <p className="text-gray-600 text-sm">No active projects</p>
                  )}
                </div>
              </div>
            </div>

            {/* Activity last 24h */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center gap-4">
              <span className="text-4xl">📡</span>
              <div>
                <p className="text-white font-semibold">{briefing.activity24h} activity events</p>
                <p className="text-gray-400 text-sm">logged in the last 24 hours</p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
