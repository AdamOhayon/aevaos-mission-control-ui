"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";

interface Agent {
  name: string;
  emoji?: string;
  role?: string;
  status: string;
  currentTask?: string | null;
  lastActivity?: string;
  lastSeen?: string;
  metrics?: { tasksCompleted?: number; tokenUsage?: number; costTotal?: number };
}

interface AgentRegistry {
  agents: Record<string, Agent>;
  metadata?: { totalAgents: number; activeAgents: number };
}

const STATUS_RING: Record<string, string> = {
  active: "ring-2 ring-green-400",
  busy:   "ring-2 ring-yellow-400",
  idle:   "ring-1 ring-gray-600",
};
const STATUS_DOT: Record<string, string> = {
  active: "bg-green-400 animate-pulse",
  busy:   "bg-yellow-400 animate-pulse",
  idle:   "bg-gray-500",
};
const STATUS_LABEL: Record<string, string> = {
  active: "text-green-400",
  busy:   "text-yellow-400",
  idle:   "text-gray-400",
};

export default function AgentsPage() {
  const [registry, setRegistry] = useState<AgentRegistry | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const fetchAgents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API}/api/office/agents`);
      if (res.ok) setRegistry(await res.json());
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAgents();
    timer.current = setInterval(() => fetchAgents(true), 15_000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [fetchAgents]);

  const agents = registry ? Object.entries(registry.agents) : [];
  const activeCount = agents.filter(([, a]) => a.status === "active" || a.status === "busy").length;

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div>
            <h1 className="text-3xl font-bold text-white">🤖 Agents</h1>
            <p className="text-gray-400 mt-1 text-sm">
              {agents.length} registered · {activeCount} active · auto-refreshes every 15s
            </p>
          </div>
          <button onClick={() => fetchAgents(true)} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">🔄</button>
        </div>

        {loading && <div className="text-gray-400 text-center py-20">Loading agents…</div>}

        {!loading && agents.length === 0 && (
          <div className="text-center py-20 text-gray-600">
            <p className="text-5xl mb-4">🤖</p>
            <p>No agents registered yet</p>
            <p className="text-sm mt-1">Agents register via <code className="text-blue-400">PATCH /api/office/agents/:id</code></p>
          </div>
        )}

        {!loading && agents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map(([id, agent]) => (
              <Link key={id} href={`/agents/${id}`}
                className={`bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-blue-600 transition-all group ${STATUS_RING[agent.status] ?? "ring-1 ring-gray-700"}`}>
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{agent.emoji ?? "🤖"}</span>
                    <div>
                      <h2 className="text-white font-bold text-lg group-hover:text-blue-300 transition-colors">{agent.name}</h2>
                      {agent.role && <p className="text-gray-500 text-xs">{agent.role}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[agent.status] ?? "bg-gray-600"}`} />
                    <span className={`text-xs font-medium capitalize ${STATUS_LABEL[agent.status] ?? "text-gray-400"}`}>
                      {agent.status}
                    </span>
                  </div>
                </div>

                {/* Current task */}
                {agent.currentTask ? (
                  <div className="bg-gray-800 rounded-lg px-3 py-2 mb-3">
                    <p className="text-xs text-gray-500 mb-0.5">Current task</p>
                    <p className="text-gray-200 text-sm truncate">{agent.currentTask}</p>
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-lg px-3 py-2 mb-3 text-gray-600 text-sm">No active task</div>
                )}

                {/* Metrics */}
                {agent.metrics && (
                  <div className="flex gap-4 text-xs text-gray-500">
                    {agent.metrics.tasksCompleted != null && (
                      <span className="flex items-center gap-1">✅ <span className="text-gray-300">{agent.metrics.tasksCompleted}</span></span>
                    )}
                    {agent.metrics.tokenUsage != null && (
                      <span className="flex items-center gap-1">🧠 <span className="text-gray-300">{(agent.metrics.tokenUsage / 1000).toFixed(0)}K</span></span>
                    )}
                    {agent.metrics.costTotal != null && (
                      <span className="flex items-center gap-1">💰 <span className="text-gray-300">${agent.metrics.costTotal.toFixed(2)}</span></span>
                    )}
                  </div>
                )}

                {/* Last activity */}
                {agent.lastActivity && (
                  <p className="text-gray-600 text-xs mt-2 truncate">{agent.lastActivity}</p>
                )}

                <div className="mt-3 text-blue-500 text-xs group-hover:text-blue-400 transition-colors">View profile →</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
