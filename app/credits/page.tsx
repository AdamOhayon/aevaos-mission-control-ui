"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";

interface ProviderBalance {
  balance?: number; limit?: number; usage?: number;
  alert_threshold?: number; currency?: string; status?: string; last_checked?: string;
}
interface Credits {
  providers: Record<string, ProviderBalance>;
  lastChecked?: string;
  alerts?: { history?: Array<{ provider: string; level: string; message: string; timestamp: string }> };
}

const ICONS: Record<string, { emoji: string; color: string }> = {
  openrouter: { emoji: '🔀', color: '#8b5cf6' },
  anthropic:  { emoji: '◈', color: '#f59e0b' },
  openai:     { emoji: '⬡', color: '#10b981' },
  google:     { emoji: '◉', color: '#3b82f6' },
};

function formatUSD(v?: number) { return v == null ? "—" : `$${v.toFixed(2)}`; }
function usagePct(usage?: number, limit?: number) { return (!usage || !limit) ? null : Math.min(100, Math.round((usage / limit) * 100)); }

export default function CreditsPage() {
  const [credits, setCredits] = useState<Credits | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingLive, setFetchingLive] = useState(false);

  const fetchCredits = useCallback(async () => {
    try { const res = await fetch(`${API}/api/credits`); if (res.ok) setCredits(await res.json()); } catch {}
    finally { setLoading(false); }
  }, []);

  async function fetchLive() {
    setFetchingLive(true);
    try { await fetch(`${API}/api/credits/refresh`, { method: "POST" }); await fetchCredits(); }
    finally { setFetchingLive(false); }
  }

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    fetchCredits();
    timerRef.current = setInterval(fetchCredits, 5 * 60_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchCredits]);

  function barColor(pct: number) {
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 70) return 'bg-amber-500';
    return 'bg-green-500';
  }
  function barGlow(pct: number) {
    if (pct >= 90) return '0 0 12px rgba(239,68,68,0.3)';
    if (pct >= 70) return '0 0 12px rgba(245,158,11,0.2)';
    return 'none';
  }

  const providers = credits ? Object.entries(credits.providers) : [];

  return (
    <div className="min-h-screen bg-[var(--aeva-bg)] pt-16 grid-bg">
      <div className="max-w-4xl mx-auto px-6 py-8 relative z-10">

        <div className="flex items-center justify-between mb-8 animate-in">
          <div>
            <h1 className="text-3xl font-bold text-white">💰 Credits & Tokens</h1>
            <p className="text-[var(--aeva-text-dim)] mt-1 text-sm">
              Last checked: {credits?.lastChecked ? new Date(credits.lastChecked).toLocaleString() : "—"}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchCredits} className="px-3 py-1.5 glass rounded-lg text-[var(--aeva-text-dim)] hover:text-white text-sm transition-colors">🔄</button>
            <button onClick={fetchLive} disabled={fetchingLive}
              className="px-3 py-1.5 glass rounded-lg text-blue-400 hover:text-blue-300 text-sm transition-colors disabled:opacity-50">
              {fetchingLive ? "⟳ Fetching…" : "⚡ Live Balance"}
            </button>
          </div>
        </div>

        {loading && <div className="text-[var(--aeva-text-dim)] text-center py-20 animate-in">Loading…</div>}

        {!loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {providers.map(([name, data], i) => {
                const pct = usagePct(data.usage, data.limit);
                const icon = ICONS[name] ?? ICONS.openrouter;
                return (
                  <div key={name} className="card-glow p-5 animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl" style={{ color: icon.color }}>{icon.emoji}</span>
                      <h2 className="text-white font-semibold capitalize">{name}</h2>
                      {data.status && (
                        <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full border ${
                          data.status === "ok"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>{data.status}</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {data.balance != null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--aeva-text-dim)]">Balance</span>
                          <span className="text-white font-mono font-medium">{formatUSD(data.balance)}</span>
                        </div>
                      )}
                      {data.usage != null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--aeva-text-dim)]">Usage</span>
                          <span className="text-white font-mono">{formatUSD(data.usage)}</span>
                        </div>
                      )}
                      {data.limit != null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--aeva-text-dim)]">Limit</span>
                          <span className="text-[var(--aeva-text-muted)] font-mono">{formatUSD(data.limit)}</span>
                        </div>
                      )}
                    </div>

                    {pct != null && (
                      <div className="mt-4">
                        <div className="flex justify-between text-[10px] text-[var(--aeva-text-muted)] mb-1">
                          <span>Usage</span><span>{pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-[var(--aeva-surface-2)] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${barColor(pct)}`}
                            style={{ width: `${pct}%`, boxShadow: barGlow(pct) }} />
                        </div>
                        {data.alert_threshold != null && (
                          <p className="text-[var(--aeva-text-muted)] text-[10px] mt-1">Alert at {data.alert_threshold}%</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {providers.length === 0 && (
                <div className="col-span-2 card-glow text-center py-12 text-[var(--aeva-text-muted)] text-sm">No provider data</div>
              )}
            </div>

            {credits?.alerts?.history && credits.alerts.history.length > 0 && (
              <div className="card-glow p-5 animate-in animate-in-delay-2">
                <h2 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">🚨 Alert History</h2>
                <div className="space-y-2">
                  {credits.alerts.history.map((alert, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className={alert.level === "critical" ? "text-red-400" : "text-amber-400"}>⚠</span>
                      <div className="flex-1">
                        <span className="text-[var(--aeva-text)] capitalize">{alert.provider}</span>
                        <span className="text-[var(--aeva-text-muted)] mx-2">·</span>
                        <span className="text-[var(--aeva-text-dim)]">{alert.message}</span>
                      </div>
                      <span className="text-[var(--aeva-text-muted)] text-xs shrink-0">{new Date(alert.timestamp).toLocaleDateString()}</span>
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
