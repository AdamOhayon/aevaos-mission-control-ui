'use client';

import { useState, useEffect } from 'react';

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

export default function AgentStatus() {
  const [agents, setAgents] = useState<AgentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/office/agents`);
      if (!response.ok) throw new Error('Failed to fetch agents');
      const data = await response.json();
      setAgents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'idle':
        return 'text-yellow-500';
      case 'busy':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'idle':
        return '🟡';
      case 'busy':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          👥 Agent Status
        </h2>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          👥 Agent Status
        </h2>
        <div className="text-red-500 dark:text-red-400">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          👥 Agent Status
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {agents?.metadata.activeAgents} active / {agents?.metadata.totalAgents} total
        </div>
      </div>

      <div className="space-y-4">
        {agents && Object.values(agents.agents).map((agent) => (
          <div
            key={agent.id}
            className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-blue-500"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{agent.emoji}</span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {agent.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {agent.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${getStatusColor(agent.status)}`}>
                  {getStatusIndicator(agent.status)} {agent.status}
                </span>
              </div>
            </div>

            {agent.currentTask && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                <span className="font-semibold text-blue-700 dark:text-blue-400">
                  Current task:
                </span>{' '}
                <span className="text-gray-700 dark:text-gray-300">
                  {agent.currentTask}
                </span>
              </div>
            )}

            {agent.lastActivity && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Last activity: {agent.lastActivity} • {formatTimestamp(agent.lastSeen)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
