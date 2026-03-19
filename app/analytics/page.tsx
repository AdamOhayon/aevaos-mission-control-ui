"use client";
import { useState, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";

interface Task {
  id: string;
  status: string;
  assignee?: string;
  completedAt?: string;
  createdAt?: string;
  urgency?: string;
  priority?: string;
}

interface ActivityEntry {
  timestamp: string;
  agent: string;
  action: string;
  message: string;
}

interface AgentData {
  name: string;
  status: string;
  metrics?: { tasksCompleted?: number; tokenUsage?: number; costTotal?: number };
}

interface AgentRegistry {
  agents: Record<string, AgentData>;
}

const ACTION_COLOR: Record<string, string> = {
  task_completed: "text-green-400",
  task_started:   "text-blue-400",
  task_blocked:   "text-red-400",
  system_init:    "text-purple-400",
  idea_captured:  "text-yellow-400",
};

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [agents, setAgents] = useState<AgentRegistry | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [tasksRes, activityRes, agentsRes] = await Promise.allSettled([
      fetch(`${API}/api/tasks`).then(r => r.json()),
      fetch(`${API}/api/office/activity?limit=100`).then(r => r.json()),
      fetch(`${API}/api/office/agents`).then(r => r.json()),
    ]);
    if (tasksRes.status === "fulfilled") setTasks(tasksRes.value.tasks ?? []);
    if (activityRes.status === "fulfilled") setActivity(Array.isArray(activityRes.value) ? activityRes.value : []);
    if (agentsRes.status === "fulfilled") setAgents(agentsRes.value);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Derived stats
  const done = tasks.filter(t => t.status === "done").length;
  const inProgress = tasks.filter(t => t.status === "in-progress").length;
  const blocked = tasks.filter(t => t.status === "blocked").length;
  const ready = tasks.filter(t => t.status === "ready").length;

  // Tasks by assignee
  const byAssignee: Record<string, number> = {};
  tasks.forEach(t => {
    if (t.assignee) byAssignee[t.assignee] = (byAssignee[t.assignee] ?? 0) + 1;
  });

  // Activity by action type
  const byAction: Record<string, number> = {};
  activity.forEach(e => {
    byAction[e.action] = (byAction[e.action] ?? 0) + 1;
  });

  // Activity by agent
  const actByAgent: Record<string, number> = {};
  activity.forEach(e => {
    actByAgent[e.agent] = (actByAgent[e.agent] ?? 0) + 1;
  });

  const agentList = agents ? Object.entries(agents.agents) : [];

  function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <p className="text-gray-400 text-sm mb-1">{label}</p>
        <p className={`text-3xl font-bold ${color ?? "text-white"}`}>{value}</p>
        {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
      </div>
    );
  }

  function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-300 w-24 truncate">{label}</span>
        <div className="flex-1 bg-gray-800 rounded-full h-2">
          <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-gray-400 w-8 text-right">{value}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">📊 Analytics</h1>
            <p className="text-gray-400 mt-1">{tasks.length} tasks · {activity.length} events</p>
          </div>
          <button onClick={fetchAll} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-gray-400 text-center py-20">Loading…</div>
        ) : (
          <>
            {/* Task stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Done" value={done} color="text-green-400" sub={`${tasks.length > 0 ? Math.round((done/tasks.length)*100) : 0}% complete`} />
              <StatCard label="In Progress" value={inProgress} color="text-blue-400" />
              <StatCard label="Blocked" value={blocked} color="text-red-400" />
              <StatCard label="Ready" value={ready} color="text-gray-300" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Tasks by assignee */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-white font-semibold mb-4">Tasks by Agent</h2>
                <div className="space-y-3">
                  {Object.entries(byAssignee).map(([agent, count]) => (
                    <BarRow key={agent} label={agent} value={count} max={tasks.length} color="bg-blue-500" />
                  ))}
                  {Object.keys(byAssignee).length === 0 && (
                    <p className="text-gray-600 text-sm">No assignee data</p>
                  )}
                </div>
              </div>

              {/* Activity by action */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-white font-semibold mb-4">Activity by Type</h2>
                <div className="space-y-3">
                  {Object.entries(byAction).sort((a,b) => b[1]-a[1]).map(([action, count]) => (
                    <BarRow key={action} label={action.replace(/_/g," ")} value={count} max={activity.length} color="bg-purple-500" />
                  ))}
                  {Object.keys(byAction).length === 0 && (
                    <p className="text-gray-600 text-sm">No activity data</p>
                  )}
                </div>
              </div>
            </div>

            {/* Agent summary */}
            {agentList.length > 0 && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-8">
                <h2 className="text-white font-semibold mb-4">Agent Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agentList.map(([id, agent]) => (
                    <div key={id} className="flex items-start gap-4 bg-gray-800 rounded-lg p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{agent.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            agent.status === "active" ? "bg-green-900 text-green-300" :
                            agent.status === "idle" ? "bg-gray-700 text-gray-300" :
                            "bg-yellow-900 text-yellow-300"
                          }`}>{agent.status}</span>
                        </div>
                        {agent.metrics && (
                          <div className="flex gap-4 mt-2 text-xs text-gray-400">
                            {agent.metrics.tasksCompleted != null && <span>✅ {agent.metrics.tasksCompleted} tasks</span>}
                            {agent.metrics.tokenUsage != null && <span>🧠 {(agent.metrics.tokenUsage/1000).toFixed(0)}K tokens</span>}
                            {agent.metrics.costTotal != null && <span>💰 ${agent.metrics.costTotal.toFixed(2)}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent activity feed */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h2 className="text-white font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {[...activity].reverse().slice(0, 20).map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm py-1 border-b border-gray-800 last:border-0">
                    <span className="text-gray-600 text-xs shrink-0 w-20">
                      {new Date(entry.timestamp).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                    </span>
                    <span className="text-blue-400 text-xs shrink-0 w-12">{entry.agent}</span>
                    <span className={`text-xs shrink-0 w-28 ${ACTION_COLOR[entry.action] ?? "text-gray-400"}`}>
                      {entry.action.replace(/_/g," ")}
                    </span>
                    <span className="text-gray-300 text-xs truncate">{entry.message}</span>
                  </div>
                ))}
                {activity.length === 0 && (
                  <p className="text-gray-600 text-sm">No activity recorded yet</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
