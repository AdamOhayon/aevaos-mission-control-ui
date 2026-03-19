"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";

interface Agent {
  name: string; emoji?: string; role?: string; status: string;
  currentTask?: string | null; lastActivity?: string; lastSeen?: string;
  currentModel?: string;
  metrics?: { tasksCompleted?: number; tokenUsage?: number; costTotal?: number; successRate?: number };
}

interface ActivityEntry {
  timestamp: string; agent: string; action: string; message: string;
  metadata?: Record<string, string>;
}

interface Task {
  id: string; title: string; status: string; urgency?: string; project?: string; completedAt?: string;
}

const STATUS_DOT: Record<string, string> = { active: "bg-green-400 animate-pulse", busy: "bg-yellow-400 animate-pulse", idle: "bg-gray-500" };
const STATUS_LABEL: Record<string, string> = { active: "text-green-400", busy: "text-yellow-400", idle: "text-gray-400" };
const ACTION_COLOR: Record<string, string> = {
  task_completed: "text-green-400", task_started: "text-blue-400", task_blocked: "text-red-400",
  task_in_progress: "text-blue-400", task_done: "text-green-400", idea_captured: "text-yellow-400",
  deployment: "text-purple-400",
};

export default function AgentProfilePage() {
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTask, setEditTask] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [agentsRes, actRes, tasksRes] = await Promise.allSettled([
      fetch(`${API}/api/office/agents`).then(r => r.json()),
      fetch(`${API}/api/office/activity?agent=${encodeURIComponent(agentId)}&limit=30`).then(r => r.json()),
      fetch(`${API}/api/tasks?assignee=${encodeURIComponent(agentId)}`).then(r => r.json()),
    ]);
    if (agentsRes.status === "fulfilled") {
      const a = agentsRes.value.agents?.[agentId];
      setAgent(a ?? null);
      setEditTask(a?.currentTask ?? "");
      setEditStatus(a?.status ?? "active");
    }
    if (actRes.status === "fulfilled") setActivity(Array.isArray(actRes.value) ? [...actRes.value].reverse() : []);
    if (tasksRes.status === "fulfilled") setTasks(tasksRes.value.tasks ?? []);
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    fetchAll();
    timer.current = setInterval(() => fetchAll(true), 15_000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [fetchAll]);

  async function saveEdit() {
    setSaving(true);
    await fetch(`${API}/api/office/agents/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: editStatus, currentTask: editTask }),
    });
    await fetchAll(true);
    setEditing(false);
    setSaving(false);
  }

  const done  = tasks.filter(t => t.status === "done").length;
  const active = tasks.filter(t => t.status === "in-progress").length;

  if (loading) return <div className="min-h-screen bg-gray-950 p-6 text-gray-400 text-center pt-20">Loading profile…</div>;
  if (!agent) return (
    <div className="min-h-screen bg-gray-950 p-6 text-center pt-20">
      <p className="text-gray-400 text-xl">Agent <code className="text-blue-400">{agentId}</code> not found</p>
      <Link href="/agents" className="text-blue-500 text-sm mt-4 inline-block hover:underline">← Back to agents</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/agents" className="text-gray-500 text-sm hover:text-gray-300 transition-colors mb-6 inline-block">← Agents</Link>

        {/* Profile header */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-5">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-6xl">{agent.emoji ?? "🤖"}</span>
              <div>
                <h1 className="text-3xl font-bold text-white">{agent.name}</h1>
                <p className="text-gray-400 mt-0.5">{agent.role ?? "AI Agent"}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[agent.status] ?? "bg-gray-500"}`} />
                  <span className={`text-sm font-medium capitalize ${STATUS_LABEL[agent.status] ?? "text-gray-400"}`}>{agent.status}</span>
                  {agent.currentModel && <span className="text-gray-600 text-xs">· {agent.currentModel}</span>}
                </div>
              </div>
            </div>
            <button onClick={() => setEditing(v => !v)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">
              {editing ? "Cancel" : "✏️ Edit"}
            </button>
          </div>

          {/* Inline edit form */}
          {editing && (
            <div className="mt-5 pt-5 border-t border-gray-700 flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-gray-400 text-xs block mb-1">Status</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                  className="bg-gray-800 text-gray-200 border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
                  {["active","idle","busy"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-48">
                <label className="text-gray-400 text-xs block mb-1">Current Task</label>
                <input type="text" value={editTask} onChange={e => setEditTask(e.target.value)}
                  placeholder="What are you working on?"
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <button onClick={saveEdit} disabled={saving}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white rounded-lg text-sm font-medium">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          )}

          {/* Current task */}
          {!editing && agent.currentTask && (
            <div className="mt-4 bg-gray-800 rounded-lg px-4 py-2.5">
              <p className="text-xs text-gray-500 mb-0.5">Working on</p>
              <p className="text-gray-200 text-sm">{agent.currentTask}</p>
            </div>
          )}

          {/* Capabilities */}
          {(agent as any).capabilities?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Capabilities</p>
              <div className="flex flex-wrap gap-1.5">
                {(agent as any).capabilities.map((cap: string) => (
                  <span key={cap} className="text-xs px-2 py-0.5 bg-gray-800 text-gray-300 border border-gray-700 rounded-full">{cap.replace(/-/g, ' ')}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Metrics row */}
        {agent.metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {[
              { label: "Tasks Done",   value: agent.metrics.tasksCompleted ?? done, icon: "✅", color: "text-green-400" },
              { label: "Active Tasks", value: active, icon: "⚡", color: "text-blue-400" },
              { label: "Tokens Used",  value: agent.metrics.tokenUsage ? `${(agent.metrics.tokenUsage/1000).toFixed(0)}K` : "—", icon: "🧠", color: "text-purple-400" },
              { label: "Total Cost",   value: agent.metrics.costTotal ? `$${agent.metrics.costTotal.toFixed(2)}` : "—", icon: "💰", color: "text-yellow-400" },
            ].map(m => (
              <div key={m.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
                <div className="text-2xl mb-1">{m.icon}</div>
                <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                <p className="text-gray-600 text-xs mt-1">{m.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Recent activity */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-white font-semibold mb-4">📡 Recent Activity</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {activity.slice(0, 20).map((e, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-gray-800 last:border-0">
                  <span className="text-gray-600 text-xs shrink-0 w-12">
                    {new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className={`text-xs shrink-0 ${ACTION_COLOR[e.action] ?? "text-gray-400"}`}>
                    {e.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-gray-400 text-xs truncate">{e.message}</span>
                </div>
              ))}
              {activity.length === 0 && <p className="text-gray-600 text-sm">No activity yet for this agent</p>}
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-white font-semibold mb-4">✅ Assigned Tasks ({tasks.length})</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {tasks.map(t => (
                <div key={t.id} className="flex items-center gap-3 py-1.5 border-b border-gray-800 last:border-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    t.status === "done" ? "bg-green-400" : t.status === "in-progress" ? "bg-blue-400" : "bg-gray-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 text-sm truncate">{t.title}</p>
                    <p className="text-gray-600 text-xs">{t.id} · {t.project ?? ""}</p>
                  </div>
                  <span className={`text-xs shrink-0 capitalize ${
                    t.status === "done" ? "text-green-400" : t.status === "in-progress" ? "text-blue-400" : "text-gray-500"
                  }`}>{t.status}</span>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-gray-600 text-sm">No tasks assigned to this agent</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
