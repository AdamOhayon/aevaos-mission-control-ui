"use client";
import { useState, useEffect, useCallback, useRef, FormEvent } from "react";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";

const STATUS_COLS = [
  { id: "ready",       label: "Ready",       color: "#6a6a9e", accent: "border-[var(--aeva-text-muted)]" },
  { id: "in-progress", label: "In Progress", color: "#3b82f6", accent: "border-blue-500/50" },
  { id: "blocked",     label: "Blocked",     color: "#ef4444", accent: "border-red-500/50" },
  { id: "review",      label: "Review",      color: "#f59e0b", accent: "border-amber-500/50" },
  { id: "done",        label: "Done",        color: "#10b981", accent: "border-green-500/50" },
];

const PRIORITY_COLOR: Record<string, string> = { urgent: "text-red-400", high: "text-orange-400", medium: "text-amber-400", low: "text-[var(--aeva-text-muted)]" };

interface ActivityLog { timestamp: string; status: string; note: string; }
interface Task {
  id: string; title: string; description?: string; project?: string; status: string;
  assignee?: string; urgency?: string; priority?: string; is_blocked?: boolean;
  completedAt?: string; createdAt?: string; createdBy?: string; notes?: string[];
  complexity?: string; activity_log?: ActivityLog[];
}
interface Alert { id: string; level: "warning" | "critical"; type: string; title: string; message: string; taskId?: string; }
interface AgentEntry { name: string; emoji: string; status: string; }

// ---- Task Detail Panel ----
function TaskDetail({ task, onClose, onStatusChange, onAssigneeChange, onDelete }: {
  task: Task; onClose: () => void; onStatusChange: (id: string, status: string) => void;
  onAssigneeChange: (id: string, assignee: string) => void; onDelete: (id: string) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState(""); const [addingNote, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [agents, setAgents] = useState<AgentEntry[]>([]); const [assigning, setAssigning] = useState(false);

  useEffect(() => { fetch(`${API}/api/office/agents`).then(r => r.json()).then(data => setAgents(Object.values(data.agents ?? {}) as AgentEntry[])).catch(() => {}); }, []);

  async function changeAssignee(v: string) { setAssigning(true); await fetch(`${API}/api/tasks/${task.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({assignee:v}) }); onAssigneeChange(task.id, v); setAssigning(false); }
  async function changeStatus(v: string) { setUpdating(true); await fetch(`${API}/api/tasks/${task.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({status:v}) }); onStatusChange(task.id, v); setUpdating(false); }
  async function addNote() { if (!note.trim()) return; setAdding(true); await fetch(`${API}/api/tasks/${task.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({note}) }); setNote(""); setAdding(false); }
  async function handleDelete() { if (!confirm(`Delete "${task.title}"?`)) return; setDeleting(true); await fetch(`${API}/api/tasks/${task.id}`, { method:"DELETE" }); onDelete(task.id); onClose(); }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-[var(--aeva-surface)] border-l border-[var(--aeva-border)] flex flex-col overflow-y-auto shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--aeva-border)]">
          <div>
            <span className="text-[var(--aeva-text-muted)] text-xs font-mono">{task.id}</span>
            <h2 className="text-white font-bold text-lg">{task.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDelete} disabled={deleting}
              className="text-red-500 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition-colors">
              {deleting ? "Deleting…" : "🗑 Delete"}
            </button>
            <button onClick={onClose} className="text-[var(--aeva-text-muted)] hover:text-white text-xl transition-colors">✕</button>
          </div>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Status */}
          <div>
            <p className="text-[var(--aeva-text-muted)] text-[10px] uppercase tracking-wider mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_COLS.map(col => (
                <button key={col.id} onClick={() => changeStatus(col.id)} disabled={updating}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    task.status === col.id
                      ? `bg-[${col.color}]/15 border-[${col.color}]/30 text-white`
                      : 'bg-[var(--aeva-surface-2)] border-[var(--aeva-border)] text-[var(--aeva-text-dim)] hover:text-white hover:border-[var(--aeva-border-hover)]'
                  }`}
                  style={task.status === col.id ? { background: `${col.color}15`, borderColor: `${col.color}40` } : {}}>
                  {col.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <p className="text-[var(--aeva-text-muted)] text-[10px] uppercase tracking-wider mb-2">Assignee</p>
            <select value={task.assignee ?? ""} onChange={e => changeAssignee(e.target.value)} disabled={assigning}
              className="w-full bg-[var(--aeva-bg)] text-white border border-[var(--aeva-border)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--aeva-blue)]">
              <option value="">Unassigned</option>
              {agents.map(a => <option key={a.name} value={a.name}>{a.emoji} {a.name}</option>)}
            </select>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {task.assignee && <div><p className="text-[var(--aeva-text-muted)] text-[10px] mb-0.5">Assigned</p><p className="text-[var(--aeva-text)]">@{task.assignee}</p></div>}
            {(task.urgency ?? task.priority) && <div><p className="text-[var(--aeva-text-muted)] text-[10px] mb-0.5">Priority</p><p className={PRIORITY_COLOR[task.urgency ?? task.priority ?? ""] ?? "text-[var(--aeva-text)]"}>{task.urgency ?? task.priority}</p></div>}
            {task.project && <div><p className="text-[var(--aeva-text-muted)] text-[10px] mb-0.5">Project</p><p className="text-[var(--aeva-text)]">{task.project}</p></div>}
            {task.complexity && <div><p className="text-[var(--aeva-text-muted)] text-[10px] mb-0.5">Complexity</p><p className="text-[var(--aeva-text)]">{task.complexity}</p></div>}
            {task.createdAt && <div><p className="text-[var(--aeva-text-muted)] text-[10px] mb-0.5">Created</p><p className="text-[var(--aeva-text)]">{new Date(task.createdAt).toLocaleDateString()}</p></div>}
            {task.completedAt && <div><p className="text-[var(--aeva-text-muted)] text-[10px] mb-0.5">Completed</p><p className="text-green-400">{new Date(task.completedAt).toLocaleDateString()}</p></div>}
          </div>

          {task.description && (
            <div><p className="text-[var(--aeva-text-muted)] text-[10px] uppercase tracking-wider mb-2">Description</p>
              <p className="text-[var(--aeva-text)] text-sm leading-relaxed">{task.description}</p></div>
          )}

          {/* Add note */}
          <div>
            <p className="text-[var(--aeva-text-muted)] text-[10px] uppercase tracking-wider mb-2">Add Note</p>
            <div className="flex gap-2">
              <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Type a note…"
                className="flex-1 bg-[var(--aeva-bg)] text-white border border-[var(--aeva-border)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--aeva-blue)]" />
              <button onClick={addNote} disabled={addingNote || !note.trim()}
                className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm transition-colors hover:bg-blue-600/30 disabled:opacity-50">
                {addingNote ? "…" : "Add"}
              </button>
            </div>
          </div>

          {/* Activity log */}
          {task.activity_log && task.activity_log.length > 0 && (
            <div>
              <p className="text-[var(--aeva-text-muted)] text-[10px] uppercase tracking-wider mb-2">Activity</p>
              <div className="space-y-2 border-l-2 border-[var(--aeva-border)] pl-3">
                {[...task.activity_log].reverse().map((entry, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--aeva-border)] bg-[var(--aeva-surface-2)] text-[var(--aeva-text-dim)]">{entry.status}</span>
                      <span className="text-[var(--aeva-text-muted)] text-xs">{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                    {entry.note && <p className="text-[var(--aeva-text-dim)] text-xs mt-0.5">{entry.note}</p>}
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
  const [newTitle, setNewTitle] = useState(""); const [newDesc, setNewDesc] = useState("");
  const [newAssignee, setAssignee] = useState(""); const [newUrgency, setUrgency] = useState("medium"); const [newProject, setProject] = useState("aeva-os");
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
      setError(null); setLastRefresh(new Date());
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); timerRef.current = setInterval(() => fetchAll(true), 30_000); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, [fetchAll]);

  async function moveTask(taskId: string, newStatus: string) {
    setUpdating(taskId);
    await fetch(`${API}/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    if (selectedTask?.id === taskId) setSelected(prev => prev ? { ...prev, status: newStatus } : prev);
    setUpdating(null);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault(); if (!newTitle.trim()) return; setSubmitting(true);
    const res = await fetch(`${API}/api/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newTitle, description: newDesc, assignee: newAssignee, urgency: newUrgency, project: newProject }) });
    if (res.ok) { const task = await res.json(); setTasks(prev => [task, ...prev]); setNewTitle(""); setNewDesc(""); setAssignee(""); setUrgency("medium"); setProject("aeva-os"); setShowForm(false); }
    setSubmitting(false);
  }

  const searchParams = useSearchParams();
  useEffect(() => { const t = searchParams.get("title"); const d = searchParams.get("description"); if (t) { setNewTitle(t); setNewDesc(d ?? ""); setShowForm(true); } }, [searchParams]);

  const filtered = filterStatus ? tasks.filter(t => t.status === filterStatus) : tasks;
  const tasksByStatus = (s: string) => filtered.filter(t => t.status === s);

  return (
    <div className="min-h-screen bg-[var(--aeva-bg)] pt-16 grid-bg">
      <div className="max-w-screen-xl mx-auto px-6 py-8 relative z-10">
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap animate-in">
          <div>
            <h1 className="text-3xl font-bold text-white">✅ Tasks</h1>
            <p className="text-[var(--aeva-text-dim)] mt-1 text-sm">
              {tasks.length} tasks · <span className="text-[var(--aeva-text-muted)]">{lastRefresh.toLocaleTimeString()}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={filterStatus} onChange={e => setFilter(e.target.value)}
              className="bg-[var(--aeva-surface)] text-[var(--aeva-text-dim)] border border-[var(--aeva-border)] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--aeva-blue)]">
              <option value="">All statuses</option>
              {STATUS_COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button onClick={() => fetchAll(true)} className="px-3 py-1.5 glass rounded-lg text-[var(--aeva-text-dim)] hover:text-white text-sm transition-colors">🔄</button>
            <button onClick={() => setShowForm(v => !v)}
              className="px-4 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium hover:bg-blue-600/30 transition-colors">
              + New Task
            </button>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-5 space-y-2 animate-in animate-in-delay-1">
            {alerts.map(alert => (
              <div key={alert.id} onClick={() => alert.taskId && setSelected(tasks.find(t => t.id === alert.taskId) ?? null)}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm border cursor-pointer transition-colors ${
                  alert.level === "critical" ? "bg-red-950/30 border-red-800/30 text-red-300 hover:bg-red-950/60" : "bg-amber-950/30 border-amber-800/30 text-amber-300 hover:bg-amber-950/60"
                }`}>
                <span className="shrink-0">{alert.level === "critical" ? "🔴" : "⚠️"}</span>
                <div className="flex-1"><span className="font-semibold">{alert.title}</span> <span className="opacity-70">· {alert.message}</span></div>
                {alert.taskId && <span className="text-xs opacity-50 shrink-0">view →</span>}
              </div>
            ))}
          </div>
        )}

        {/* New task form */}
        {showForm && (
          <form onSubmit={handleCreate} className="card-glow p-5 mb-6 space-y-3 animate-in">
            <h2 className="text-white font-semibold text-sm">New Task</h2>
            <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} required placeholder="Task title…"
              className="w-full bg-[var(--aeva-bg)] text-white border border-[var(--aeva-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--aeva-blue)] transition-all placeholder-[var(--aeva-text-muted)]" />
            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description…" rows={2}
              className="w-full bg-[var(--aeva-bg)] text-white border border-[var(--aeva-border)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--aeva-blue)] transition-all resize-none placeholder-[var(--aeva-text-muted)]" />
            <div className="flex flex-wrap gap-3 items-center">
              <input type="text" value={newAssignee} onChange={e => setAssignee(e.target.value)} placeholder="Assignee"
                className="flex-1 min-w-32 bg-[var(--aeva-bg)] text-white border border-[var(--aeva-border)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--aeva-blue)]" />
              <select value={newUrgency} onChange={e => setUrgency(e.target.value)}
                className="bg-[var(--aeva-surface)] text-[var(--aeva-text-dim)] border border-[var(--aeva-border)] rounded-lg px-3 py-1.5 text-xs focus:outline-none">
                {["urgent","high","medium","low"].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <select value={newProject} onChange={e => setProject(e.target.value)}
                className="bg-[var(--aeva-surface)] text-[var(--aeva-text-dim)] border border-[var(--aeva-border)] rounded-lg px-3 py-1.5 text-xs focus:outline-none">
                {["aeva-os","leanleren","pilotax","lifeos","crewplanet"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button type="submit" disabled={submitting}
                className="px-4 py-1.5 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-medium hover:bg-green-600/30 transition-colors disabled:opacity-50">
                {submitting ? "Creating…" : "Create"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-[var(--aeva-text-muted)] text-xs hover:text-white transition-colors">Cancel</button>
            </div>
          </form>
        )}

        {loading && <div className="text-[var(--aeva-text-dim)] text-center py-20 animate-in">Loading tasks…</div>}
        {error && <div className="text-red-400 text-center py-20">{error}</div>}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-in animate-in-delay-2">
            {STATUS_COLS.map(col => (
              <div key={col.id} className={`bg-[var(--aeva-surface)] rounded-2xl border-t-2 ${col.accent} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-[var(--aeva-text-dim)] uppercase tracking-wider">{col.label}</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--aeva-border)] text-[var(--aeva-text-dim)]"
                    style={tasksByStatus(col.id).length > 0 ? { background: `${col.color}15`, borderColor: `${col.color}30`, color: col.color } : {}}>
                    {tasksByStatus(col.id).length}
                  </span>
                </div>
                <div className="space-y-2">
                  {tasksByStatus(col.id).map(task => (
                    <div key={task.id} onClick={() => setSelected(task)}
                      className={`card-glow p-3 cursor-pointer group ${task.is_blocked ? 'border-red-500/30' : ''}`}>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="text-white text-xs font-medium leading-tight group-hover:text-blue-300 transition-colors">{task.title}</p>
                        {task.is_blocked && <span className="text-[10px] text-red-400 shrink-0">🔴</span>}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-[10px] text-[var(--aeva-text-muted)] font-mono">{task.id}</span>
                        {task.assignee && <span className="text-[10px] text-blue-400">@{task.assignee}</span>}
                        {(task.urgency ?? task.priority) && (
                          <span className={`text-[10px] ${PRIORITY_COLOR[task.urgency ?? task.priority ?? ""] ?? ""}`}>{task.urgency ?? task.priority}</span>
                        )}
                      </div>
                      {task.project && <p className="text-[10px] text-[var(--aeva-text-muted)] mt-1">{task.project}</p>}
                      <select disabled={updating === task.id} value={task.status}
                        onChange={e => { e.stopPropagation(); moveTask(task.id, e.target.value); }}
                        onClick={e => e.stopPropagation()}
                        className="mt-2 w-full text-[10px] bg-[var(--aeva-bg)] text-[var(--aeva-text-dim)] border border-[var(--aeva-border)] rounded px-1 py-0.5 focus:outline-none focus:border-[var(--aeva-blue)]">
                        {STATUS_COLS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                  ))}
                  {tasksByStatus(col.id).length === 0 && (
                    <div className="text-[var(--aeva-text-muted)] text-[10px] text-center py-4 border border-dashed border-[var(--aeva-border)] rounded-xl">No tasks</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetail task={selectedTask} onClose={() => setSelected(null)}
          onStatusChange={(id, status) => { setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t)); setSelected(prev => prev ? { ...prev, status } : prev); }}
          onAssigneeChange={(id, assignee) => { setTasks(prev => prev.map(t => t.id === id ? { ...t, assignee } : t)); setSelected(prev => prev ? { ...prev, assignee } : prev); }}
          onDelete={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
        />
      )}
    </div>
  );
}
