"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";

interface ProviderBalance {
  balance?: number;
  limit?: number;
  usage?: number;
  alert_threshold?: number;
  currency?: string;
  status?: string;
  last_checked?: string;
}

interface Credits {
  providers: Record<string, ProviderBalance>;
  lastChecked?: string;
  alerts?: {
    history?: Array<{ provider: string; level: string; message: string; timestamp: string }>;
  };
}

const PROVIDER_ICONS: Record<string, string> = {
  openrouter: "🔀",
  anthropic: "🟠",
  openai: "🟢",
  google: "🔵",
};

function formatUSD(v?: number) {
  if (v == null) return "—";
  return `$${v.toFixed(2)}`;
}

function usagePercent(usage?: number, limit?: number) {
  if (!usage || !limit) return null;
  return Math.min(100, Math.round((usage / limit) * 100));
}

export default function CreditsPage() {
  const [credits, setCredits] = useState<Credits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/credits`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCredits(await res.json());
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    fetchCredits();
    timerRef.current = setInterval(fetchCredits, 5 * 60_000); // 5-minute auto-refresh
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchCredits]);

  function barColor(pct: number) {
    if (pct >= 90) return "bg-red-500";
    if (pct >= 70) return "bg-yellow-500";
    return "bg-green-500";
  }

  const providers = credits ? Object.entries(credits.providers) : [];

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">💰 Credits</h1>
            <p className="text-gray-400 mt-1">
              Last checked: {credits?.lastChecked ? new Date(credits.lastChecked).toLocaleString() : "—"}
            </p>
          </div>
          <button onClick={fetchCredits} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">
            🔄 Refresh
          </button>

        </div>

        {loading && <div className="text-gray-400 text-center py-20">Loading…</div>}
        {error && <div className="text-red-400 text-center py-20">Error: {error}</div>}

        {!loading && !error && (
          <>
            {/* Provider cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {providers.map(([name, data]) => {
                const pct = usagePercent(data.usage, data.limit);
                return (
                  <div key={name} className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">{PROVIDER_ICONS[name] ?? "🤖"}</span>
                      <h2 className="text-white font-semibold capitalize">{name}</h2>
                      {data.status && (
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                          data.status === "ok" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                        }`}>
                          {data.status}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {data.balance != null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Balance</span>
                          <span className="text-white font-mono">{formatUSD(data.balance)}</span>
                        </div>
                      )}
                      {data.usage != null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Usage</span>
                          <span className="text-white font-mono">{formatUSD(data.usage)}</span>
                        </div>
                      )}
                      {data.limit != null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Limit</span>
                          <span className="text-white font-mono">{formatUSD(data.limit)}</span>
                        </div>
                      )}
                    </div>

                    {pct != null && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Usage</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${barColor(pct)}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {data.alert_threshold != null && (
                          <p className="text-xs text-gray-500 mt-1">Alert threshold: {data.alert_threshold}%</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {providers.length === 0 && (
                <div className="col-span-2 text-center text-gray-600 py-12 border border-dashed border-gray-800 rounded-xl">
                  No provider data available
                </div>
              )}
            </div>

            {/* Alert history */}
            {credits?.alerts?.history && credits.alerts.history.length > 0 && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-white font-semibold mb-3">🚨 Alert History</h2>
                <div className="space-y-2">
                  {credits.alerts.history.map((alert, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className={alert.level === "critical" ? "text-red-400" : "text-yellow-400"}>⚠</span>
                      <div>
                        <span className="text-gray-300 capitalize">{alert.provider}</span>
                        <span className="text-gray-500 mx-2">·</span>
                        <span className="text-gray-400">{alert.message}</span>
                      </div>
                      <span className="ml-auto text-gray-600 text-xs shrink-0">
                        {new Date(alert.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
