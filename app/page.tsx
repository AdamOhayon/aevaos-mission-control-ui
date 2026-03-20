'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-194a.up.railway.app';

interface AgentInfo { name: string; emoji?: string; status?: string; preferred_model?: string; }
interface DispatchItem { agent: string; input_message: string; status: string; timestamp?: string; classification?: { type: string }; }

const MESH_AGENTS = [
  { id: 'aeva',  emoji: '🌀', label: 'Aeva',  color: '#8b5cf6', offset: 0   },
  { id: 'clara', emoji: '👩‍💻', label: 'Clara', color: '#3b82f6', offset: 90  },
  { id: 'pixel', emoji: '🎨', label: 'Pixel', color: '#ec4899', offset: 180 },
  { id: 'sage',  emoji: '🔍', label: 'Sage',  color: '#10b981', offset: 270 },
];

export default function Home() {
  const [agents, setAgents] = useState<Record<string, AgentInfo>>({});
  const [dispatches, setDispatches] = useState<DispatchItem[]>([]);
  const [stats, setStats] = useState({ tasks: 0, projects: 0, ideas: 0, dispatches: 0 });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [agentRes, dispatchRes, taskRes, projectRes, ideaRes] = await Promise.all([
        fetch(`${API}/api/office/agents`),
        fetch(`${API}/api/agents/dispatch/history?limit=5`),
        fetch(`${API}/api/tasks`),
        fetch(`${API}/api/projects`),
        fetch(`${API}/api/ideas`),
      ]);
      const agentData = await agentRes.json();
      const dispatchData = await dispatchRes.json();
      const taskData = await taskRes.json();
      const projectData = await projectRes.json();
      const ideaData = await ideaRes.json();

      setAgents(agentData.agents ?? {});
      setDispatches(dispatchData.dispatches ?? []);
      setStats({
        tasks: taskData.tasks?.length ?? 0,
        projects: projectData.projects?.length ?? 0,
        ideas: ideaData.ideas?.length ?? 0,
        dispatches: dispatchData.count ?? 0,
      });
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 30_000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const activeCount = Object.values(agents).filter(a => a.status === 'active' || a.status === 'busy').length;

  return (
    <div className="min-h-screen bg-[var(--aeva-bg)] pt-16 grid-bg noise">
      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">

        {/* Hero */}
        <div className="text-center mb-12 animate-in">
          <div className="text-7xl mb-4 animate-float">🌀</div>
          <h1 className="text-5xl font-extrabold text-shimmer tracking-tight mb-2">AevaOS</h1>
          <p className="text-[var(--aeva-text-dim)] text-sm tracking-[0.3em] uppercase">Mission Control · AI Agent Orchestration</p>
        </div>

        {/* Agent Mesh Visualization */}
        <div className="flex justify-center mb-12 animate-in animate-in-delay-1">
          <div className="relative" style={{ width: 280, height: 280 }}>
            {/* Center hub */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[var(--aeva-surface-2)] border border-[var(--aeva-border)] flex items-center justify-center z-10">
              <span className="text-2xl">🌀</span>
            </div>
            {/* Orbital ring */}
            <div className="absolute inset-8 rounded-full border border-dashed border-[var(--aeva-border)]" />
            {/* Agent nodes */}
            {MESH_AGENTS.map((agent, i) => {
              const angle = (agent.offset * Math.PI) / 180;
              const radius = 100;
              const x = 140 + radius * Math.cos(angle) - 24;
              const y = 140 + radius * Math.sin(angle) - 24;
              const agentData = agents[agent.id];
              const isActive = agentData?.status === 'active' || agentData?.status === 'busy';
              return (
                <Link key={agent.id} href={`/agents/${agent.id}`}
                  className="absolute w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-125 group"
                  style={{
                    left: x, top: y,
                    background: `${agent.color}15`,
                    border: `1px solid ${agent.color}40`,
                    boxShadow: isActive ? `0 0 16px ${agent.color}30` : 'none',
                  }}>
                  <span className="text-xl">{agent.emoji}</span>
                  {isActive && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #10b981' }} />
                  )}
                  <span className="absolute -bottom-6 text-[10px] font-medium text-[var(--aeva-text-dim)] group-hover:text-white transition-colors whitespace-nowrap">
                    {agent.label}
                  </span>
                </Link>
              );
            })}
            {/* Connecting lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 280 280">
              {MESH_AGENTS.map(agent => {
                const angle = (agent.offset * Math.PI) / 180;
                const r = 100;
                return (
                  <line key={agent.id}
                    x1="140" y1="140"
                    x2={140 + r * Math.cos(angle)}
                    y2={140 + r * Math.sin(angle)}
                    stroke={agent.color} strokeWidth="1" opacity="0.15"
                    strokeDasharray="4 4"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 animate-in animate-in-delay-2">
          {[
            { label: 'Agents Online', value: `${activeCount}/${Object.keys(agents).length}`, icon: '🤖', color: 'var(--aeva-blue)' },
            { label: 'Active Tasks', value: stats.tasks, icon: '✅', color: 'var(--aeva-green)' },
            { label: 'Projects', value: stats.projects, icon: '🚀', color: 'var(--aeva-purple)' },
            { label: 'Dispatches', value: stats.dispatches, icon: '⚡', color: 'var(--aeva-cyan)' },
          ].map(s => (
            <div key={s.label} className="card-glow p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{s.icon}</span>
                <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: s.color }}>{s.label}</span>
              </div>
              <p className="text-3xl font-bold text-white">{loading ? '—' : s.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Access + Recent Dispatches */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in animate-in-delay-3">

          {/* Quick Access */}
          <div className="lg:col-span-2">
            <h2 className="text-[var(--aeva-text-muted)] text-[10px] uppercase tracking-[0.2em] font-semibold mb-3">Quick Access</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { href: '/dispatch',  icon: '⚡', label: 'Dispatch', desc: 'Route tasks' },
                { href: '/agents',    icon: '🤖', label: 'Agents', desc: 'Agent mesh' },
                { href: '/tasks',     icon: '✅', label: 'Tasks', desc: 'Task board' },
                { href: '/projects',  icon: '🚀', label: 'Projects', desc: 'All projects' },
                { href: '/office',    icon: '🏢', label: 'Office', desc: 'Live comms' },
                { href: '/briefing',  icon: '📋', label: 'Briefing', desc: 'Daily brief' },
                { href: '/ideas',     icon: '💡', label: 'Ideas', desc: 'Idea vault' },
                { href: '/credits',   icon: '💰', label: 'Credits', desc: 'Token health' },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className="card-glow p-4 flex flex-col items-center gap-1.5 text-center group cursor-pointer">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                  <span className="text-white text-sm font-medium">{item.label}</span>
                  <span className="text-[var(--aeva-text-muted)] text-[10px]">{item.desc}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Dispatches */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[var(--aeva-text-muted)] text-[10px] uppercase tracking-[0.2em] font-semibold">Recent Dispatches</h2>
              <Link href="/dispatch" className="text-[10px] text-blue-500 hover:text-blue-400 transition-colors">View all →</Link>
            </div>
            <div className="space-y-2">
              {dispatches.length === 0 && !loading && (
                <div className="card-glow p-6 text-center">
                  <p className="text-[var(--aeva-text-muted)] text-xs">No dispatches yet</p>
                  <Link href="/dispatch" className="text-blue-500 text-xs hover:text-blue-400 mt-1 inline-block">Send your first →</Link>
                </div>
              )}
              {dispatches.map((d, i) => {
                const agentMeta = MESH_AGENTS.find(a => a.id === d.agent);
                return (
                  <div key={i} className="card-glow p-3 flex items-start gap-2.5">
                    <span className="text-lg shrink-0">{agentMeta?.emoji ?? '🤖'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{d.input_message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-medium capitalize" style={{ color: agentMeta?.color ?? '#6a6a9e' }}>
                          {d.agent}
                        </span>
                        {d.classification?.type && (
                          <span className="text-[var(--aeva-text-muted)] text-[10px]">{d.classification.type}</span>
                        )}
                        <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'success' ? 'bg-green-400' : d.status === 'error' ? 'bg-red-400' : 'bg-amber-400'}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Version footer */}
        <div className="mt-16 text-center">
          <p className="text-[var(--aeva-text-muted)] text-[10px] tracking-widest uppercase">
            AevaOS v1.5.0 · Agent Mesh Active · {Object.keys(agents).length} Agents Registered
          </p>
        </div>
      </div>
    </div>
  );
}
