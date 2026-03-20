"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";

interface Agent {
  name: string;
  emoji?: string;
  role?: string;
  status: string;
  preferred_model?: string;
  fallback_model?: string;
  currentTask?: string | null;
  lastActivity?: string;
  lastSeen?: string;
  capabilities?: string[];
  task_types?: string[];
  metrics?: { tasksCompleted?: number; dispatches_sent?: number; tokenUsage?: number; costTotal?: number };
}

interface AgentRegistry {
  agents: Record<string, Agent>;
  metadata?: { totalAgents: number; activeAgents: number };
}

const AGENT_COLORS: Record<string, { ring: string; glow: string; accent: string; bg: string }> = {
  aeva:  { ring: '#8b5cf6', glow: 'rgba(139,92,246,0.15)', accent: 'text-purple-400', bg: 'bg-purple-500/10' },
  clara: { ring: '#3b82f6', glow: 'rgba(59,130,246,0.15)',  accent: 'text-blue-400',   bg: 'bg-blue-500/10' },
  pixel: { ring: '#ec4899', glow: 'rgba(236,72,153,0.15)',  accent: 'text-pink-400',   bg: 'bg-pink-500/10' },
  sage:  { ring: '#10b981', glow: 'rgba(16,185,129,0.15)',  accent: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

const MODEL_LOGOS: Record<string, string> = {
  'openai': '⬡',
  'anthropic': '◈',
  'google': '◉',
};

function getModelLogo(model?: string) {
  if (!model) return '🤖';
  if (model.includes('openai') || model.includes('o3') || model.includes('o4')) return MODEL_LOGOS.openai;
  if (model.includes('anthropic') || model.includes('claude')) return MODEL_LOGOS.anthropic;
  if (model.includes('google') || model.includes('gemini')) return MODEL_LOGOS.google;
  return '🤖';
}

function getModelShort(model?: string) {
  if (!model) return '';
  return model.split('/').pop()?.replace('-preview', '') ?? model;
}

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
    <div className="min-h-screen bg-[var(--aeva-bg)] pt-16 grid-bg">
      <div className="max-w-5xl mx-auto px-6 py-8 relative z-10">
        <div className="flex items-center justify-between mb-8 animate-in">
          <div>
            <h1 className="text-3xl font-bold text-white">🤖 Agent Mesh</h1>
            <p className="text-[var(--aeva-text-dim)] mt-1 text-sm">
              {agents.length} registered · <span className="text-green-400">{activeCount} online</span> · auto-refreshes
            </p>
          </div>
          <button onClick={() => fetchAgents(true)} className="px-3 py-1.5 glass rounded-lg text-[var(--aeva-text-dim)] hover:text-white text-sm transition-colors hover:bg-white/[0.04]">🔄</button>
        </div>

        {loading && <div className="text-[var(--aeva-text-dim)] text-center py-20">Loading agents…</div>}

        {!loading && agents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {agents.map(([id, agent], idx) => {
              const colors = AGENT_COLORS[id] ?? AGENT_COLORS.aeva;
              const isActive = agent.status === 'active' || agent.status === 'busy';
              return (
                <Link key={id} href={`/agents/${id}`}
                  className={`card-glow p-6 group animate-in`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar with glow ring */}
                      <div className="relative">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all duration-300 group-hover:scale-110"
                          style={{
                            background: `${colors.ring}12`,
                            border: `1px solid ${colors.ring}40`,
                            boxShadow: isActive ? `0 0 20px ${colors.glow}, inset 0 0 20px ${colors.glow}` : 'none',
                          }}
                        >
                          {agent.emoji ?? '🤖'}
                        </div>
                        {isActive && (
                          <span
                            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[var(--aeva-surface)]"
                            style={{ background: '#10b981', boxShadow: '0 0 8px #10b981' }}
                          />
                        )}
                      </div>
                      <div>
                        <h2 className="text-white font-bold text-lg group-hover:text-blue-300 transition-colors">{agent.name}</h2>
                        {agent.role && <p className="text-[var(--aeva-text-dim)] text-xs mt-0.5 max-w-[200px] truncate">{agent.role}</p>}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: `${colors.ring}10` }}>
                      <span className={`w-2 h-2 rounded-full ${isActive ? 'animate-pulse' : ''}`}
                        style={{ background: isActive ? '#10b981' : '#3a3a6e' }} />
                      <span className={`text-[10px] font-medium capitalize ${isActive ? 'text-green-400' : 'text-[var(--aeva-text-muted)]'}`}>
                        {agent.status}
                      </span>
                    </div>
                  </div>

                  {/* Model badge */}
                  {agent.preferred_model && (
                    <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-[var(--aeva-surface-2)] border border-[var(--aeva-border)]">
                      <span className="text-sm" style={{ color: colors.ring }}>{getModelLogo(agent.preferred_model)}</span>
                      <span className="text-[var(--aeva-text)] text-xs font-mono">{getModelShort(agent.preferred_model)}</span>
                      {agent.fallback_model && (
                        <span className="text-[var(--aeva-text-muted)] text-[10px] ml-auto">fallback: {getModelShort(agent.fallback_model)}</span>
                      )}
                    </div>
                  )}

                  {/* Capabilities */}
                  {agent.task_types && agent.task_types.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {agent.task_types.slice(0, 5).map(cap => (
                        <span key={cap} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--aeva-surface-2)] text-[var(--aeva-text-dim)] border border-[var(--aeva-border)]">
                          {cap}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Current task */}
                  {agent.currentTask ? (
                    <div className="bg-[var(--aeva-surface-2)] rounded-lg px-3 py-2 mb-3 border border-[var(--aeva-border)]">
                      <p className="text-[10px] text-[var(--aeva-text-muted)] mb-0.5 uppercase tracking-wider">Active</p>
                      <p className="text-[var(--aeva-text)] text-sm truncate">{agent.currentTask}</p>
                    </div>
                  ) : (
                    <div className="bg-[var(--aeva-surface-2)] rounded-lg px-3 py-2 mb-3 text-[var(--aeva-text-muted)] text-xs border border-[var(--aeva-border)]">
                      Idle — awaiting dispatch
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    {agent.lastActivity && (
                      <p className="text-[var(--aeva-text-muted)] text-[10px] truncate max-w-[70%]">{agent.lastActivity}</p>
                    )}
                    <span className={`text-xs ${colors.accent} group-hover:translate-x-1 transition-transform duration-200`}>View →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
