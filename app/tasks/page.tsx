"use client";
import { useState, useEffect, useCallback, useRef, FormEvent } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";
const REFRESH_INTERVAL = 30_000; // 30 seconds

const STATUS_COLS = [
  { id: "ready",       label: "Ready",       color: "border-gray-500",   badge: "bg-gray-700 text-gray-200"   },
  { id: "in-progress", label: "In Progress", color: "border-blue-500",   badge: "bg-blue-900 text-blue-200"   },
  { id: "blocked",     label: "Blocked",     color: "border-red-500",    badge: "bg-red-900 text-red-200"     },
  { id: "review",      label: "Review",      color: "border-yellow-500", badge: "bg-yellow-900 text-yellow-200"},
  { id: "done",        label: "Done",        color: "border-green-500",  badge: "bg-green-900 text-green-200" },
];

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "text-red-400", high: "text-orange-400", medium: "text-yellow-400", low: "text-gray-400",
};

interface Task { id: string; title: string; description?: string; project?: string; status: string; assignee?: string; urgency?: string; priority?: string; is_blocked?: boolean; completedAt?: string; }
interface Alert { id: string; level: "warning" | "critical"; type: string; title: string; message: string; taskId?: string; }

export default function TasksPage() {
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [alerts, setAlerts]         = useState<Alert[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [updating, setUpdating]     = useState<string | null>(null);
  const [showForm, setShowForm]     = useState(false);
  const [filterStatus, setFilter]   = useState<string>("");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // New task form state
  const [newTitle, setNewTitle]     = useState("");
  const [newDesc, setNewDesc]       = useState("");
  const [newAssignee, setAssignee]  = useState("");
  const [newUrgency, setUrgency]    = useState("medium");
  const [newProject, setProject]    = useState("aeva-os");
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [tasksRes, alertsRes] = await Promise.allSettled([
        fetch(`${API}/api/tasks`).then(r => r.json()),
        fetch(`${API}/api/alerts`).then(r => r.json()),
      ]);
      if (tasksRes.status === "fulfilled") setTasks(tasksRes.value.tasks ?? []);
      if (alertsRes.status === "fulfilled") setAlerts(alertsRes.value.alerts ?? []);
      setError(null);
      setLastRefresh(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(() => fetchAll(true), REFRESH_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchAll]);

  async function moveTask(taskId: string, newStatus: string) {
    setUpdating(taskId);
    try {
      await fetch(`${API}/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } finally {
      setUpdating(null);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, description: newDesc, assignee: newAssignee, urgency: newUrgency, project: newProject }),
      });
      if (res.ok) {
        const task = await res.json();
        setTasks(prev => [task, ...prev]);
        setNewTitle(""); setNewDesc(""); setAssignee(""); setUrgency("medium"); setProject("aeva-os");
        setShowForm(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const visibleTasks = filterStatus ? tasks.filter(t => t.status === filterStatus) : tasks;
  const tasksByStatus = (status: string) => visibleTasks.filter(t => t.status === status);

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-screen-xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-white">✅ Tasks</h1>
            <p className="text-gray-400 mt-1 text-sm">
              {tasks.length} tasks · auto-refreshes every 30s ·{" "}
              <span className="text-gray-600">last update {lastRefresh.toLocaleTimeString()}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterStatus}
              onChange={e => setFilter(e.target.value)}
              className="bg-gray-800 text-gray-300 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            >
              <option value="">All statuses</option>
              {STATUS_COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button onClick={() => fetchAll(true)} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">🔄</button>
            <button
              onClick={() => setShowForm(v => !v)}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >+ New Task</button>
          </div>
        </div>

        {/* Smart alert banner */}
        {alerts.length > 0 && (
          <div className="mb-5 space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm ${
                alert.level === "critical"
                  ? "bg-red-950 border-red-700 text-red-200"
                  : "bg-yellow-950 border-yellow-700 text-yellow-200"
              }`}>
                <span className="shrink-0 text-lg">{alert.level === "critical" ? "🔴" : "⚠️"}</span>
                <div>
                  <span className="font-semibold">{alert.title}</span>
                  <span className="mx-2 opacity-50">·</span>
                  <span className="opacity-80">{alert.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New task form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-6 space-y-3">
            <h2 className="text-white font-semibold">New Task</h2>
            <input
              type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} required
              placeholder="Task title…"
              className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <textarea
              value={newDesc} onChange={e => setNewDesc(e.target.value)}
              placeholder="Description (optional)…" rows={2}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text" value={newAssignee} onChange={e => setAssignee(e.target.value)}
                placeholder="Assignee (e.g. aeva)"
                className="flex-1 min-w-32 bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              />
              <select value={newUrgency} onChange={e => setUrgency(e.target.value)}
                className="bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
                {["urgent","high","medium","low"].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <select value={newProject} onChange={e => setProject(e.target.value)}
                className="bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
                {["aeva-os","leanleren","pilotax","lifeos","crewplanet"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button type="submit" disabled={submitting}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white rounded-lg text-sm font-medium">
                {submitting ? "Creating…" : "Create Task"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 text-sm hover:text-gray-300">Cancel</button>
            </div>
          </form>
        )}

        {loading && <div className="text-gray-400 text-center py-20">Loading tasks…</div>}
        {error && <div className="text-red-400 text-center py-20">Error: {error}</div>}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {STATUS_COLS.map(col => (
              <div key={col.id} className={`bg-gray-900 rounded-xl border-t-2 ${col.color} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">{col.label}</h2>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>{tasksByStatus(col.id).length}</span>
                </div>

                <div className="space-y-2">
                  {tasksByStatus(col.id).map(task => (
                    <div key={task.id} className={`bg-gray-800 rounded-lg p-3 border transition-colors ${
                      task.is_blocked ? "border-red-700" : "border-gray-700 hover:border-gray-500"
                    }`}>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="text-white text-sm font-medium leading-tight">{task.title}</p>
                        {task.is_blocked && <span className="text-xs text-red-400 shrink-0">🔴</span>}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-xs text-gray-600">{task.id}</span>
                        {task.assignee && <span className="text-xs text-blue-400">@{task.assignee}</span>}
                        {(task.urgency ?? task.priority) && (
                          <span className={`text-xs ${PRIORITY_COLOR[task.urgency ?? task.priority ?? ""] ?? "text-gray-400"}`}>
                            {task.urgency ?? task.priority}
                          </span>
                        )}
                      </div>
                      {task.project && <p className="text-xs text-gray-600 mt-1">{task.project}</p>}
                      <select
                        disabled={updating === task.id}
                        value={task.status}
                        onChange={e => moveTask(task.id, e.target.value)}
                        className="mt-2 w-full text-xs bg-gray-700 text-gray-300 border border-gray-600 rounded px-1 py-0.5 focus:outline-none focus:border-blue-500"
                      >
                        {STATUS_COLS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                  ))}
                  {tasksByStatus(col.id).length === 0 && (
                    <div className="text-gray-600 text-xs text-center py-4 border border-dashed border-gray-700 rounded-lg">No tasks</div>
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
