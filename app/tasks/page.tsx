"use client";
import { useState, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";

const STATUS_COLS = [
  { id: "ready", label: "Ready", color: "border-gray-500", badge: "bg-gray-700 text-gray-200" },
  { id: "in-progress", label: "In Progress", color: "border-blue-500", badge: "bg-blue-900 text-blue-200" },
  { id: "blocked", label: "Blocked", color: "border-red-500", badge: "bg-red-900 text-red-200" },
  { id: "review", label: "Review", color: "border-yellow-500", badge: "bg-yellow-900 text-yellow-200" },
  { id: "done", label: "Done", color: "border-green-500", badge: "bg-green-900 text-green-200" },
];

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "text-red-400",
  high: "text-orange-400",
  medium: "text-yellow-400",
  low: "text-gray-400",
};

interface Task {
  id: string;
  title: string;
  description?: string;
  project?: string;
  status: string;
  assignee?: string;
  priority?: string;
  urgency?: string;
  complexity?: string;
  is_blocked?: boolean;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/tasks`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTasks(data.tasks ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  async function moveTask(taskId: string, newStatus: string) {
    setUpdating(taskId);
    try {
      const res = await fetch(`${API}/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
      }
    } catch {
      // optimistically updated already, refresh
      fetchTasks();
    } finally {
      setUpdating(null);
    }
  }

  const tasksByStatus = (status: string) => tasks.filter((t) => t.status === status);

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">✅ Tasks</h1>
          <p className="text-gray-400 mt-1">Kanban board — {tasks.length} tasks</p>
        </div>

        {loading && (
          <div className="text-gray-400 text-center py-20">Loading tasks…</div>
        )}
        {error && (
          <div className="text-red-400 text-center py-20">Error: {error}</div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {STATUS_COLS.map((col) => (
              <div key={col.id} className={`bg-gray-900 rounded-xl border-t-2 ${col.color} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    {col.label}
                  </h2>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                    {tasksByStatus(col.id).length}
                  </span>
                </div>

                <div className="space-y-2">
                  {tasksByStatus(col.id).map((task) => (
                    <div
                      key={task.id}
                      className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-500 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="text-white text-sm font-medium leading-tight">{task.title}</p>
                        {task.is_blocked && (
                          <span className="text-xs text-red-400 shrink-0">🔴</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-xs text-gray-500">{task.id}</span>
                        {task.assignee && (
                          <span className="text-xs text-blue-400">@{task.assignee}</span>
                        )}
                        {(task.urgency || task.priority) && (
                          <span className={`text-xs ${PRIORITY_COLOR[task.urgency ?? task.priority ?? ""] ?? "text-gray-400"}`}>
                            {task.urgency ?? task.priority}
                          </span>
                        )}
                      </div>
                      {task.project && (
                        <p className="text-xs text-gray-500 mt-1">{task.project}</p>
                      )}
                      {/* Quick move */}
                      <select
                        disabled={updating === task.id}
                        value={task.status}
                        onChange={(e) => moveTask(task.id, e.target.value)}
                        className="mt-2 w-full text-xs bg-gray-700 text-gray-300 border border-gray-600 rounded px-1 py-0.5 focus:outline-none focus:border-blue-500"
                      >
                        {STATUS_COLS.map((s) => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}

                  {tasksByStatus(col.id).length === 0 && (
                    <div className="text-gray-600 text-xs text-center py-4 border border-dashed border-gray-700 rounded-lg">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
