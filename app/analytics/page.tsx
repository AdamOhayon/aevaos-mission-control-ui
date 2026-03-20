"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";

interface Summary {
  generatedAt: string;
  tasks: { total: number; done: number; inProgress: number; blocked: number; ready: number; completionRate: number; velocity7d: number; recentCompletions: Array<{ id: string; title: string; completedAt?: string }>; };
  agents: { active: number; activeList: string[]; topContributors: Array<{ name: string; tasks: number }>; };
  activity: { last7d: number; total: number };
  projects: { distribution: Array<{ project: string; tasks: number }> };
}

function Ring({ pct, color, label, sub }: { pct: number; color: string; label: string; sub: string }) {
  const r = 38, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--aeva-border)" strokeWidth="6" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 48 48)" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
        <text x="48" y="54" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="Inter">{pct}%</text>
      </svg>
      <p className="text-white text-sm font-semibold">{label}</p>
      <p className="text-[var(--aeva-text-muted)] text-[10px]">{sub}</p>
    </div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-[var(--aeva-text)] w-28 truncate capitalize text-xs">{label}</span>
      <div className="flex-1 bg-[var(--aeva-surface-2)] rounded-full h-1.5">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[var(--aeva-text-dim)] w-8 text-right font-mono text-xs">{value}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try { const res = await fetch(`${API}/api/analytics/summary`); if (res.ok) setSummary(await res.json()); } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    timer.current = setInterval(() => fetchAll(true), 30_000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [fetchAll]);

  const t = summary?.tasks;
  const maxProject = Math.max(...(summary?.projects.distribution.map(p => p.tasks) ?? [1]));
  const maxContrib = Math.max(...(summary?.agents.topContributors.map(c => c.tasks) ?? [1]));

  return (
    <div className="min-h-screen bg-[var(--aeva-bg)] pt-16 grid-bg">
      <div className="max-w-5xl mx-auto px-6 py-8 relative z-10">
        <div className="flex items-center justify-between mb-8 animate-in">
          <div>
            <h1 className="text-3xl font-bold text-white">📊 Analytics</h1>
            <p className="text-[var(--aeva-text-dim)] mt-1 text-sm">Performance metrics · auto-refreshes</p>
          </div>
          <button onClick={() => fetchAll(true)} className="px-3 py-1.5 glass rounded-lg text-[var(--aeva-text-dim)] hover:text-white text-sm transition-colors">🔄</button>
        </div>

        {loading ? <div className="text-[var(--aeva-text-dim)] text-center py-20 animate-in">Loading analytics…</div> : (
          <>
            {/* Ring gauges */}
            <div className="card-glow p-8 mb-6 flex flex-wrap justify-around gap-8 animate-in animate-in-delay-1">
              <Ring pct={t?.completionRate ?? 0} color="#10b981" label="Completion" sub={`${t?.done ?? 0}/${t?.total ?? 0} done`} />
              <Ring pct={t && t.total > 0 ? Math.round((t.inProgress / t.total) * 100) : 0} color="#3b82f6" label="In Progress" sub={`${t?.inProgress ?? 0} active`} />
              <Ring pct={t && t.total > 0 ? Math.round((t.blocked / t.total) * 100) : 0} color="#ef4444" label="Blocked" sub={`${t?.blocked ?? 0} stuck`} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-in animate-in-delay-2">
              {[
                { label: "Velocity (7d)", value: t?.velocity7d ?? 0, icon: "⚡", color: "var(--aeva-blue)" },
                { label: "Total Tasks", value: t?.total ?? 0, icon: "📋", color: "var(--aeva-text)" },
                { label: "Active Agents", value: summary?.agents.active ?? 0, icon: "🤖", color: "var(--aeva-green)" },
                { label: "Activity (7d)", value: summary?.activity.last7d ?? 0, icon: "📡", color: "var(--aeva-purple)" },
              ].map(s => (
                <div key={s.label} className="card-glow p-4">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[var(--aeva-text-muted)] text-[10px] mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 animate-in animate-in-delay-3">
              <div className="card-glow p-5">
                <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">🏆 Top Contributors</h2>
                <div className="space-y-3">
                  {summary?.agents.topContributors.map(c => (
                    <BarRow key={c.name} label={c.name} value={c.tasks} max={maxContrib} color="#3b82f6" />
                  ))}
                  {!summary?.agents.topContributors.length && <p className="text-[var(--aeva-text-muted)] text-sm">No data</p>}
                </div>
              </div>

              <div className="card-glow p-5">
                <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">🚀 Tasks by Project</h2>
                <div className="space-y-3">
                  {summary?.projects.distribution.map(p => (
                    <BarRow key={p.project} label={p.project} value={p.tasks} max={maxProject} color="#8b5cf6" />
                  ))}
                  {!summary?.projects.distribution.length && <p className="text-[var(--aeva-text-muted)] text-sm">No data</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in animate-in-delay-4">
              <div className="card-glow p-5">
                <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">✅ Recent Completions</h2>
                <div className="space-y-2">
                  {summary?.tasks.recentCompletions.map(c => (
                    <div key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b border-[var(--aeva-border)] last:border-0">
                      <div>
                        <span className="text-[var(--aeva-text-muted)] text-xs font-mono mr-2">{c.id}</span>
                        <span className="text-[var(--aeva-text)]">{c.title}</span>
                      </div>
                      <span className="text-[var(--aeva-text-muted)] text-xs shrink-0">{c.completedAt ? new Date(c.completedAt).toLocaleDateString() : "—"}</span>
                    </div>
                  ))}
                  {!summary?.tasks.recentCompletions.length && <p className="text-[var(--aeva-text-muted)] text-sm">None yet</p>}
                </div>
              </div>

              <div className="card-glow p-5">
                <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">🤖 Active Agents</h2>
                <div className="space-y-2">
                  {summary?.agents.activeList.map(name => (
                    <div key={name} className="flex items-center gap-2.5 py-1">
                      <div className="w-2.5 h-2.5 bg-green-400 rounded-full" style={{ boxShadow: '0 0 6px #10b981' }} />
                      <span className="text-[var(--aeva-text)] capitalize text-sm">{name}</span>
                    </div>
                  ))}
                  {!summary?.agents.activeList.length && <p className="text-[var(--aeva-text-muted)] text-sm">No active agents</p>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
