"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";

interface BlockerEntry {
  detected_at: string;
  blockers: Array<{ task_id?: string; description?: string; severity?: string }>;
  source?: string;
}

interface Alert {
  id: string; level: string; type: string; title: string; message: string; taskId?: string; hoursStale?: number;
}

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

  // Current live blockers & stale from alerts
  const taskBlockers = alerts.filter(a => a.type === "task_blocked");
  const staleAlerts  = alerts.filter(a => a.type === "task_stale");
  const creditAlerts = alerts.filter(a => a.type === "credit_low");

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div>
            <h1 className="text-3xl font-bold text-white">🚫 Blockers</h1>
            <p className="text-gray-400 mt-1 text-sm">
              Live obstruction detection · scanned {lastScan.toLocaleTimeString()}
            </p>
          </div>
          <button onClick={() => fetchAll(true)} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm">🔄 Re-scan</button>
        </div>

        {loading ? <div className="text-gray-400 text-center py-20">Scanning…</div> : (
          <>
            {/* Live scan summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Task Blockers", count: taskBlockers.length, icon: "🚫", color: taskBlockers.length > 0 ? "text-red-400 border-red-800 bg-red-950" : "text-gray-400 border-gray-800 bg-gray-900" },
                { label: "Stale Tasks",   count: staleAlerts.length,  icon: "⏰", color: staleAlerts.length  > 0 ? "text-yellow-400 border-yellow-800 bg-yellow-950" : "text-gray-400 border-gray-800 bg-gray-900" },
                { label: "Credit Alerts", count: creditAlerts.length, icon: "💰", color: creditAlerts.length > 0 ? "text-orange-400 border-orange-800 bg-orange-950" : "text-gray-400 border-gray-800 bg-gray-900" },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border p-4 text-center ${s.color}`}>
                  <div className="text-3xl mb-1">{s.icon}</div>
                  <div className="text-2xl font-bold">{s.count}</div>
                  <div className="text-xs mt-1 opacity-70">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Active issues */}
            {alerts.length > 0 ? (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-6">
                <h2 className="text-white font-semibold mb-3">⚡ Active Issues ({alerts.length})</h2>
                <div className="space-y-2">
                  {alerts.map(a => (
                    <div key={a.id} className={`flex items-start gap-3 px-4 py-3 rounded-lg text-sm border ${
                      a.level === "critical" ? "bg-red-950 border-red-700 text-red-200" : "bg-yellow-950 border-yellow-700 text-yellow-200"
                    }`}>
                      <span className="shrink-0">{a.level === "critical" ? "🔴" : "⚠️"}</span>
                      <div>
                        <p className="font-semibold">{a.title}</p>
                        <p className="opacity-80 text-xs mt-0.5">{a.message}
                          {a.hoursStale ? ` (${a.hoursStale}h stale)` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-xl border border-green-800 p-5 mb-6 flex items-center gap-4">
                <span className="text-4xl">✅</span>
                <div>
                  <p className="text-green-400 font-semibold">All clear</p>
                  <p className="text-gray-400 text-sm">No blockers, stale tasks, or credit warnings detected.</p>
                </div>
              </div>
            )}

            {/* Detection history */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h2 className="text-white font-semibold mb-4">📜 Scan History ({history.length})</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.length === 0 && <p className="text-gray-600 text-sm">No scan history yet</p>}
                {history.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0 text-sm">
                    <div className="flex items-center gap-3">
                      <span className={entry.blockers.length > 0 ? "text-red-400" : "text-green-400"}>
                        {entry.blockers.length > 0 ? "🚫" : "✅"}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {new Date(entry.detected_at).toLocaleString()}
                      </span>
                      {entry.source && (
                        <span className="text-gray-600 text-xs">via {entry.source}</span>
                      )}
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
