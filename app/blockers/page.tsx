"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";

interface BlockerEntry { detected_at: string; blockers: Array<{ task_id?: string; description?: string; severity?: string }>; source?: string; }
interface Alert { id: string; level: string; type: string; title: string; message: string; taskId?: string; hoursStale?: number; }

export default function BlockersPage() {
  const [history, setHistory] = useState<BlockerEntry[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastScan, setLastScan] = useState<Date>(new Date());
  const timer = useRef<NodeJS.Timeout | null>(null);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [blockRes, alertRes] = await Promise.allSettled([
      fetch(`${API}/api/blockers`).then(r => r.json()),
      fetch(`${API}/api/alerts`).then(r => r.json()),
    ]);
    if (blockRes.status === "fulfilled") setHistory([...(blockRes.value.history ?? [])].reverse());
    if (alertRes.status === "fulfilled") setAlerts(alertRes.value.alerts ?? []);
    setLastScan(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    timer.current = setInterval(() => fetchAll(true), 30_000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [fetchAll]);

  const taskBlockers = alerts.filter(a => a.type === "task_blocked");
  const staleAlerts  = alerts.filter(a => a.type === "task_stale");
  const creditAlerts = alerts.filter(a => a.type === "credit_low");

  return (
    <div className="min-h-screen bg-[var(--aeva-bg)] pt-16 grid-bg">
      <div className="max-w-4xl mx-auto px-6 py-8 relative z-10">
        <div className="flex items-center justify-between mb-8 animate-in">
          <div>
            <h1 className="text-3xl font-bold text-white">🚫 Blockers</h1>
            <p className="text-[var(--aeva-text-dim)] mt-1 text-sm">
              Live obstruction detection · scanned {lastScan.toLocaleTimeString()}
            </p>
          </div>
          <button onClick={() => fetchAll(true)} className="px-3 py-1.5 glass rounded-lg text-[var(--aeva-text-dim)] hover:text-white text-sm transition-colors">🔄 Re-scan</button>
        </div>

        {loading ? <div className="text-[var(--aeva-text-dim)] text-center py-20 animate-in">Scanning…</div> : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4 mb-6 animate-in animate-in-delay-1">
              {[
                { label: "Task Blockers", count: taskBlockers.length, icon: "🚫", active: taskBlockers.length > 0, activeColor: "text-red-400", activeBg: "bg-red-500/10 border-red-500/20" },
                { label: "Stale Tasks",   count: staleAlerts.length,  icon: "⏰", active: staleAlerts.length > 0,  activeColor: "text-amber-400", activeBg: "bg-amber-500/10 border-amber-500/20" },
                { label: "Credit Alerts", count: creditAlerts.length, icon: "💰", active: creditAlerts.length > 0, activeColor: "text-orange-400", activeBg: "bg-orange-500/10 border-orange-500/20" },
              ].map(s => (
                <div key={s.label} className={`card-glow p-4 text-center ${s.active ? s.activeBg : ''}`}>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className={`text-2xl font-bold ${s.active ? s.activeColor : 'text-[var(--aeva-text-muted)]'}`}>{s.count}</div>
                  <div className="text-[10px] mt-1 text-[var(--aeva-text-muted)]">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Active issues */}
            {alerts.length > 0 ? (
              <div className="card-glow p-5 mb-6 animate-in animate-in-delay-2">
                <h2 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">⚡ Active Issues ({alerts.length})</h2>
                <div className="space-y-2">
                  {alerts.map(a => (
                    <div key={a.id} className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm border ${
                      a.level === "critical" ? "bg-red-950/30 border-red-800/30 text-red-300" : "bg-amber-950/30 border-amber-800/30 text-amber-300"
                    }`}>
                      <span className="shrink-0">{a.level === "critical" ? "🔴" : "⚠️"}</span>
                      <div>
                        <p className="font-semibold">{a.title}</p>
                        <p className="opacity-80 text-xs mt-0.5">{a.message}{a.hoursStale ? ` (${a.hoursStale}h stale)` : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card-glow p-5 mb-6 flex items-center gap-4 border-green-500/20 bg-green-500/5 animate-in animate-in-delay-2">
                <span className="text-3xl">✅</span>
                <div>
                  <p className="text-green-400 font-semibold text-sm">All Clear</p>
                  <p className="text-[var(--aeva-text-muted)] text-xs">No blockers, stale tasks, or credit warnings detected.</p>
                </div>
              </div>
            )}

            {/* Scan history */}
            <div className="card-glow p-5 animate-in animate-in-delay-3">
              <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">📜 Scan History ({history.length})</h2>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {history.length === 0 && <p className="text-[var(--aeva-text-muted)] text-sm">No scan history yet</p>}
                {history.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--aeva-border)] last:border-0 text-sm">
                    <div className="flex items-center gap-3">
                      <span className={entry.blockers.length > 0 ? "text-red-400" : "text-green-400"}>{entry.blockers.length > 0 ? "🚫" : "✅"}</span>
                      <span className="text-[var(--aeva-text-muted)] text-xs">{new Date(entry.detected_at).toLocaleString()}</span>
                      {entry.source && <span className="text-[var(--aeva-text-muted)] text-[10px]">via {entry.source}</span>}
                    </div>
                    <span className={`text-xs font-medium ${entry.blockers.length > 0 ? "text-red-400" : "text-green-400"}`}>
                      {entry.blockers.length > 0 ? `${entry.blockers.length} blocker(s)` : "Clear"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
