"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";

interface Briefing {
  generatedAt: string; period: string; date: string; headline: string;
  highlights: string[];
  taskSummary: { total: number; done: number; active: number; blocked: number; ready: number; velocity7d: number; recentlyCompleted: Array<{ id: string; title: string }>; };
  agentSummary: { total: number; active: number; agents: Array<{ name: string; status: string; currentTask?: string }>; };
  projectSummary: { active: number; atRisk: number; projects: Array<{ name: string; health: string; status: string }>; };
  activity24h: number; alerts: Array<{ level: string; message: string }>;
}

const HEALTH: Record<string, { text: string; dot: string }> = {
  green: { text: 'text-green-400', dot: 'bg-green-400' },
  yellow: { text: 'text-amber-400', dot: 'bg-amber-400' },
  red: { text: 'text-red-400', dot: 'bg-red-400' },
  unknown: { text: 'text-[var(--aeva-text-muted)]', dot: 'bg-gray-500' },
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
      setBriefing(await res.json()); setError(null); setLastRefresh(new Date());
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchBriefing();
    timer.current = setInterval(() => fetchBriefing(true), 60_000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [fetchBriefing]);

  const t = briefing?.taskSummary;
  const total = t?.total ?? 0;
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[var(--aeva-bg)] pt-16 grid-bg">
      <div className="max-w-4xl mx-auto px-6 py-8 relative z-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-in">
          <div>
            <h1 className="text-3xl font-bold text-white">📋 Daily Briefing</h1>
            <p className="text-[var(--aeva-text-dim)] mt-1 text-sm">
              {briefing?.headline ?? "Loading situational awareness…"} · <span className="text-[var(--aeva-text-muted)]">{lastRefresh.toLocaleTimeString()}</span>
            </p>
          </div>
          <button onClick={() => fetchBriefing(true)} className="px-3 py-1.5 glass rounded-lg text-[var(--aeva-text-dim)] hover:text-white text-sm transition-colors">🔄</button>
        </div>

        {loading && <div className="text-[var(--aeva-text-dim)] text-center py-20 animate-in">Generating briefing…</div>}
        {error && <div className="text-red-400 bg-red-950/30 border border-red-800/30 rounded-xl p-4 mt-4 text-sm">{error}</div>}

        {briefing && !loading && (
          <div className="space-y-5">

            {/* Alerts */}
            {briefing.alerts.length > 0 && (
              <div className="space-y-2 animate-in">
                {briefing.alerts.map((a, i) => (
                  <div key={i} className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm border ${
                    a.level === "critical" ? "bg-red-950/30 border-red-800/30 text-red-300" : "bg-amber-950/30 border-amber-800/30 text-amber-300"
                  }`}>
                    <span>{a.level === "critical" ? "🔴" : "⚠️"}</span>
                    <span>{a.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Highlights */}
            <div className="card-glow p-5 animate-in animate-in-delay-1">
              <h2 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">✨ Highlights</h2>
              {briefing.highlights.length > 0 ? (
                <ul className="space-y-2">
                  {briefing.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[var(--aeva-text)] text-sm">
                      <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400" style={{ boxShadow: '0 0 6px #3b82f6' }} />
                      {h}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[var(--aeva-text-muted)] text-sm">All systems nominal.</p>
              )}
            </div>

            {/* Task Summary */}
            <div className="card-glow p-5 animate-in animate-in-delay-2">
              <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">✅ Tasks</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                {[
                  { label: "Total", value: t?.total ?? 0, color: "text-white" },
                  { label: "Done", value: t?.done ?? 0, color: "text-green-400" },
                  { label: "Active", value: t?.active ?? 0, color: "text-blue-400" },
                  { label: "Blocked", value: t?.blocked ?? 0, color: "text-red-400" },
                  { label: "Velocity 7d", value: t?.velocity7d ?? 0, color: "text-purple-400" },
                ].map(s => (
                  <div key={s.label} className="bg-[var(--aeva-surface-2)] border border-[var(--aeva-border)] rounded-xl p-3 text-center">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[var(--aeva-text-muted)] text-[10px] mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-[var(--aeva-text-muted)] mb-1">
                  <span>Completion</span><span>{pct(t?.done ?? 0)}%</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--aeva-surface-2)] rounded-full overflow-hidden flex">
                  <div className="bg-green-500 h-full transition-all" style={{ width: `${pct(t?.done ?? 0)}%` }} />
                  <div className="bg-blue-500 h-full transition-all" style={{ width: `${pct(t?.active ?? 0)}%` }} />
                  <div className="bg-red-500 h-full transition-all" style={{ width: `${pct(t?.blocked ?? 0)}%` }} />
                </div>
                <div className="flex gap-4 mt-1.5 text-[10px] text-[var(--aeva-text-muted)]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500 inline-block" />Done</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500 inline-block" />Active</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500 inline-block" />Blocked</span>
                </div>
              </div>

              {t?.recentlyCompleted && t.recentlyCompleted.length > 0 && (
                <div>
                  <p className="text-[var(--aeva-text-muted)] text-[10px] uppercase tracking-wider mb-2">Completed last 24h</p>
                  <div className="space-y-1">
                    {t.recentlyCompleted.map(c => (
                      <div key={c.id} className="flex items-center gap-2 text-sm">
                        <span className="text-green-400">✓</span>
                        <span className="text-[var(--aeva-text-muted)] text-xs font-mono">{c.id}</span>
                        <span className="text-[var(--aeva-text)]">{c.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Agents + Projects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in animate-in-delay-3">
              <div className="card-glow p-5">
                <h2 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">🤖 Agents</h2>
                <div className="space-y-3">
                  {briefing.agentSummary.agents.map((agent, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                        agent.status === 'active' ? 'bg-green-400 animate-pulse' : agent.status === 'busy' ? 'bg-amber-400 animate-pulse' : 'bg-gray-500'
                      }`} style={{ boxShadow: agent.status === 'active' ? '0 0 6px #10b981' : 'none' }} />
                      <div>
                        <p className="text-[var(--aeva-text)] text-sm font-medium">{agent.name}</p>
                        {agent.currentTask ? (
                          <p className="text-[var(--aeva-text-dim)] text-xs">→ {agent.currentTask}</p>
                        ) : (
                          <p className="text-[var(--aeva-text-muted)] text-xs capitalize">{agent.status}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-glow p-5">
                <h2 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">🚀 Projects</h2>
                <div className="space-y-3">
                  {briefing.projectSummary.projects.map((p, i) => {
                    const h = HEALTH[p.health ?? 'unknown'] ?? HEALTH.unknown;
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-[var(--aeva-text)] text-sm">{p.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${h.dot}`} />
                          <span className={`text-xs ${h.text}`}>{p.health ?? "—"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="card-glow p-4 flex items-center gap-4 animate-in animate-in-delay-4">
              <span className="text-3xl">📡</span>
              <div>
                <p className="text-white font-semibold text-sm">{briefing.activity24h} events</p>
                <p className="text-[var(--aeva-text-muted)] text-xs">logged in the last 24 hours</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
