'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  status: 'active' | 'idle' | 'busy';
  currentTask: string | null;
  lastSeen: string;
  lastActivity: string;
}

interface AgentsData {
  agents: Record<string, Agent>;
  metadata: {
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-194a.up.railway.app';

const STATUS_DOT: Record<string, string> = {
  active: 'bg-green-400 animate-pulse',
  busy:   'bg-yellow-400 animate-pulse',
  idle:   'bg-gray-500',
};
const STATUS_TEXT: Record<string, string> = {
  active: 'text-green-400',
  busy:   'text-yellow-400',
  idle:   'text-gray-400',
};
const STATUS_BORDER: Record<string, string> = {
  active: 'border-l-green-500',
  busy:   'border-l-yellow-500',
  idle:   'border-l-gray-600',
};

export default function AgentStatus() {
  const [agents, setAgents] = useState<AgentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/office/agents`);
      if (!response.ok) throw new Error('Failed to fetch agents');
      setAgents(await response.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 15_000);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  function timeAgo(ts: string) {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold text-lg">👥 Agent Status</h2>
        {agents && (
          <span className="text-gray-400 text-sm">
            {agents.metadata.activeAgents} active / {agents.metadata.totalAgents} total
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-500" />
        </div>
      )}

      {error && <div className="text-red-400 text-sm py-4">Error: {error}</div>}

      {!loading && !error && agents && (
        <div className="space-y-3">
          {Object.values(agents.agents).map((agent) => (
            <Link key={agent.id} href={`/agents/${agent.id}`}
              className={`block p-4 bg-gray-800 rounded-lg border-l-4 ${STATUS_BORDER[agent.status] ?? 'border-l-gray-600'} hover:bg-gray-750 transition-colors`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{agent.emoji}</span>
                  <div>
                    <h3 className="text-white font-semibold">{agent.name}</h3>
                    <p className="text-gray-500 text-xs">{agent.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[agent.status] ?? 'bg-gray-600'}`} />
                  <span className={`text-xs font-medium capitalize ${STATUS_TEXT[agent.status] ?? 'text-gray-400'}`}>
                    {agent.status}
                  </span>
                </div>
              </div>

              {agent.currentTask && (
                <div className="bg-gray-700 rounded px-2 py-1.5 text-sm">
                  <span className="text-blue-400 font-medium text-xs">Current: </span>
                  <span className="text-gray-200 text-xs">{agent.currentTask}</span>
                </div>
              )}

              {agent.lastActivity && (
                <p className="text-gray-600 text-xs mt-2 truncate">
                  {agent.lastActivity} · {timeAgo(agent.lastSeen)}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      {!loading && !error && agents && Object.keys(agents.agents).length === 0 && (
        <p className="text-gray-600 text-sm text-center py-6">No agents registered</p>
      )}
    </div>
  );
}
