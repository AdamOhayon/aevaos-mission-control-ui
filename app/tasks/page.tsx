"use client";
import { useState, useEffect, useCallback, useRef, FormEvent } from "react";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";
const REFRESH_INTERVAL = 30_000;

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

interface ActivityLog { timestamp: string; status: string; note: string; }
interface Task {
  id: string; title: string; description?: string; project?: string; status: string;
  assignee?: string; urgency?: string; priority?: string; is_blocked?: boolean;
  completedAt?: string; createdAt?: string; createdBy?: string; notes?: string[];
  complexity?: string; activity_log?: ActivityLog[];
}
interface Alert { id: string; level: "warning" | "critical"; type: string; title: string; message: string; taskId?: string; }

// ---- Task Detail Panel ----
interface AgentEntry { name: string; emoji: string; status: string; }

function TaskDetail({ task, onClose, onStatusChange, onAssigneeChange, onDelete }: {
  task: Task;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onAssigneeChange: (id: string, assignee: string) => void;
  onDelete: (id: string) => void;
}) {
  const [updating, setUpdating]   = useState(false);
  const [note, setNote]           = useState("");
  const [addingNote, setAdding]   = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [agents, setAgents]       = useState<AgentEntry[]>([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/office/agents`)
      .then(r => r.json())
      .then(data => {
        const list = Object.values(data.agents ?? {}) as AgentEntry[];
        setAgents(list);
      })
      .catch(() => {});
  }, []);

  async function changeAssignee(newAssignee: string) {
    setAssigning(true);
    await fetch(`${API}/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignee: newAssignee }),
    });
    onAssigneeChange(task.id, newAssignee);
    setAssigning(false);
  }

  async function changeStatus(newStatus: string) {
    setUpdating(true);
    await fetch(`${API}/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    onStatusChange(task.id, newStatus);
    setUpdating(false);
  }

  async function addNote() {
    if (!note.trim()) return;
    setAdding(true);
    await fetch(`${API}/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    setNote("");
    setAdding(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`${API}/api/tasks/${task.id}`, { method: "DELETE" });
    onDelete(task.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="w-full max-w-md bg-gray-900 border-l border-gray-700 flex flex-col overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <span className="text-gray-500 text-xs font-mono">{task.id}</span>
            <h2 className="text-white font-bold text-lg">{task.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDelete} disabled={deleting}
              className="text-red-500 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-950 transition-colors">
              {deleting ? "Deleting…" : "🗑 Delete"}
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-white text-xl transition-colors">✕</button>
          </div>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Status selector */}
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_COLS.map(col => (
                <button key={col.id} onClick={() => changeStatus(col.id)} disabled={updating}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    task.status === col.id ? col.badge : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}>
                  {col.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assign agent */}
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Assignee</p>
            <select
              value={task.assignee ?? ""}
              onChange={e => changeAssignee(e.target.value)}
              disabled={assigning}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Unassigned</option>
              {agents.map(a => (
                <option key={a.name} value={a.name}>{a.emoji} {a.name}</option>
              ))}
            </select>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {task.assignee && (
              <div><p className="text-gray-500 text-xs mb-0.5">Assigned to</p><p className="text-gray-300">@{task.assignee}</p></div>
            )}
            {(task.urgency ?? task.priority) && (
              <div><p className="text-gray-500 text-xs mb-0.5">Priority</p>
                <p className={PRIORITY_COLOR[task.urgency ?? task.priority ?? ""] ?? "text-gray-300"}>
                  {task.urgency ?? task.priority}
                </p>
              </div>
            )}
            {task.project && (
              <div><p className="text-gray-500 text-xs mb-0.5">Project</p><p className="text-gray-300">{task.project}</p></div>
            )}
            {task.complexity && (
              <div><p className="text-gray-500 text-xs mb-0.5">Complexity</p><p className="text-gray-300">{task.complexity}</p></div>
            )}
            {task.createdAt && (
              <div><p className="text-gray-500 text-xs mb-0.5">Created</p><p className="text-gray-300">{new Date(task.createdAt).toLocaleDateString()}</p></div>
            )}
            {task.completedAt && (
              <div><p className="text-gray-500 text-xs mb-0.5">Completed</p><p className="text-green-400">{new Date(task.completedAt).toLocaleDateString()}</p></div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Description</p>
              <p className="text-gray-300 text-sm leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* Add note */}
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Add Note</p>
            <div className="flex gap-2">
              <input type="text" value={note} onChange={e => setNote(e.target.value)}
                placeholder="Type a note…"
                className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
              <button onClick={addNote} disabled={addingNote || !note.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg text-sm transition-colors">
                {addingNote ? "…" : "Add"}
              </button>
            </div>
          </div>

          {/* Activity log */}
          {task.activity_log && task.activity_log.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Activity Log</p>
              <div className="space-y-2 border-l-2 border-gray-700 pl-3">
                {[...task.activity_log].reverse().map((entry, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        STATUS_COLS.find(c => c.id === entry.status)?.badge ?? "bg-gray-700 text-gray-300"
                      }`}>{entry.status}</span>
                      <span className="text-gray-600 text-xs">{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                    {entry.note && <p className="text-gray-400 text-xs mt-0.5">{entry.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Main Tasks Page ----
export default function TasksPage() {
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [alerts, setAlerts]         = useState<Alert[]>([]);
  const [selectedTask, setSelected] = useState<Task | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [updating, setUpdating]     = useState<string | null>(null);
  const [showForm, setShowForm]     = useState(false);
  const [filterStatus, setFilter]   = useState<string>("");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const [newTitle, setNewTitle]   = useState("");
  const [newDesc, setNewDesc]     = useState("");
  const [newAssignee, setAssignee] = useState("");
  const [newUrgency, setUrgency]  = useState("medium");
  const [newProject, setProject]  = useState("aeva-os");
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
    await fetch(`${API}/api/tasks/${taskId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    if (selectedTask?.id === taskId) setSelected(prev => prev ? { ...prev, status: newStatus } : prev);
    setUpdating(null);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    const res = await fetch(`${API}/api/tasks`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, description: newDesc, assignee: newAssignee, urgency: newUrgency, project: newProject }),
    });
    if (res.ok) {
      const task = await res.json();
      setTasks(prev => [task, ...prev]);
      setNewTitle(""); setNewDesc(""); setAssignee(""); setUrgency("medium"); setProject("aeva-os");
      setShowForm(false);
    }
    setSubmitting(false);
  }

  function openDetail(task: Task) {
    setSelected(task);
  }

  const searchParams = useSearchParams();

  // Auto-open form when navigated from Idea→Task conversion
  useEffect(() => {
    const t = searchParams.get("title");
    const d = searchParams.get("description");
    if (t) {
      setNewTitle(t);
      setNewDesc(d ?? "");
      setShowForm(true);
    }
  }, [searchParams]);

  const filtered = filterStatus ? tasks.filter(t => t.status === filterStatus) : tasks;
  const tasksByStatus = (status: string) => filtered.filter(t => t.status === status);

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-screen-xl mx-auto">

        <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-white">✅ Tasks</h1>
            <p className="text-gray-400 mt-1 text-sm">
              {tasks.length} tasks · auto-refreshes every 30s ·{" "}
              <span className="text-gray-600">updated {lastRefresh.toLocaleTimeString()}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={filterStatus} onChange={e => setFilter(e.target.value)}
              className="bg-gray-800 text-gray-300 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
              <option value="">All statuses</option>
              {STATUS_COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button onClick={() => fetchAll(true)} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">🔄</button>
            <button onClick={() => setShowForm(v => !v)}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              + New Task
            </button>
          </div>
        </div>

        {/* Alert banner */}
        {alerts.length > 0 && (
          <div className="mb-5 space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} onClick={() => alert.taskId && openDetail(tasks.find(t => t.id === alert.taskId) ?? tasks[0])}
                className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm cursor-pointer ${
                  alert.level === "critical" ? "bg-red-950 border-red-700 text-red-200 hover:bg-red-900" : "bg-yellow-950 border-yellow-700 text-yellow-200 hover:bg-yellow-900"
                } transition-colors`}>
                <span className="shrink-0">{alert.level === "critical" ? "🔴" : "⚠️"}</span>
                <div className="flex-1">
                  <span className="font-semibold">{alert.title}</span>
                  <span className="mx-2 opacity-50">·</span>
                  <span className="opacity-80">{alert.message}</span>
                </div>
                {alert.taskId && <span className="text-xs opacity-50 shrink-0">click to view →</span>}
              </div>
            ))}
          </div>
        )}

        {/* New task form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-6 space-y-3">
            <h2 className="text-white font-semibold">New Task</h2>
            <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} required
              placeholder="Task title…"
              className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description…" rows={2}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
            <div className="flex flex-wrap gap-3 items-center">
              <input type="text" value={newAssignee} onChange={e => setAssignee(e.target.value)} placeholder="Assignee"
                className="flex-1 min-w-32 bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
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
        {error   && <div className="text-red-400 text-center py-20">Error: {error}</div>}

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
                    <div key={task.id}
                      onClick={() => openDetail(task)}
                      className={`bg-gray-800 rounded-lg p-3 border cursor-pointer transition-all group ${
                        task.is_blocked ? "border-red-700" : "border-gray-700 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-900/20"
                      }`}>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="text-white text-sm font-medium leading-tight group-hover:text-blue-200 transition-colors">{task.title}</p>
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
                      <div className="mt-2 text-xs text-gray-600 group-hover:text-blue-500 transition-colors">click to view details</div>
                      <select disabled={updating === task.id} value={task.status}
                        onChange={e => { e.stopPropagation(); moveTask(task.id, e.target.value); }}
                        onClick={e => e.stopPropagation()}
                        className="mt-2 w-full text-xs bg-gray-700 text-gray-300 border border-gray-600 rounded px-1 py-0.5 focus:outline-none focus:border-blue-500">
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

      {/* Task detail slide-out */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelected(null)}
          onStatusChange={(id, status) => {
            setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
            setSelected(prev => prev ? { ...prev, status } : prev);
          }}
          onAssigneeChange={(id, assignee) => {
            setTasks(prev => prev.map(t => t.id === id ? { ...t, assignee } : t));
            setSelected(prev => prev ? { ...prev, assignee } : prev);
          }}
          onDelete={(id) => {
            setTasks(prev => prev.filter(t => t.id !== id));
          }}
        />
      )}
    </div>
  );
}
