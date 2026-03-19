'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-194a.up.railway.app';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: number;
  github?: string;
  health: string;
  lastActivity?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  assignee: string;
  urgency: string;
  is_blocked: boolean;
  completedAt?: string;
  createdAt?: string;
}

const HEALTH_COLOR: Record<string, string> = {
  green:   'text-green-400',
  yellow:  'text-yellow-400',
  red:     'text-red-400',
  unknown: 'text-gray-500',
};
const HEALTH_BG: Record<string, string> = {
  green:   'bg-green-950 border-green-800',
  yellow:  'bg-yellow-950 border-yellow-800',
  red:     'bg-red-950 border-red-800',
  unknown: 'bg-gray-900 border-gray-800',
};
const STATUS_COLORS: Record<string, string> = {
  done:         'bg-green-900 text-green-300',
  'in-progress':'bg-blue-900 text-blue-300',
  ready:        'bg-gray-800 text-gray-300',
  blocked:      'bg-red-900 text-red-300',
};
const URGENCY_DOT: Record<string, string> = {
  high:   'bg-red-400',
  medium: 'bg-yellow-400',
  low:    'bg-green-400',
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject]   = useState<Project | null>(null);
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [filterStatus, setFilterSt] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        fetch(`${API}/api/projects`),
        fetch(`${API}/api/tasks?project=${encodeURIComponent(projectId)}`),
      ]);
      const projData = await projRes.json();
      const taskData = await taskRes.json();

      const found = projData.projects?.find((p: Project) => p.id === projectId);
      setProject(found ?? null);
      setTasks(taskData.tasks ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(fetchAll, 30_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchAll]);

  function timeAgo(ts?: string) {
    if (!ts) return '—';
    const diff = Date.now() - new Date(ts).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    return `${d}d ago`;
  }

  const filtered = filterStatus ? tasks.filter(t => t.status === filterStatus) : tasks;
  const byStatus = (s: string) => tasks.filter(t => t.status === s).length;

  const STATUSES = ['ready', 'in-progress', 'done', 'blocked'];

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Back */}
        <Link href="/projects" className="text-gray-500 hover:text-white text-sm mb-6 inline-flex items-center gap-1 transition-colors">
          ← Back to Projects
        </Link>

        {loading && <div className="text-gray-400 text-center py-20">Loading…</div>}
        {error   && <div className="text-red-400 bg-red-950 border border-red-800 rounded-xl p-4 mt-4">{error}</div>}

        {!loading && !error && !project && (
          <div className="text-gray-500 text-center py-20">Project "{projectId}" not found.</div>
        )}

        {project && (
          <>
            {/* Header */}
            <div className={`rounded-xl border p-6 mb-6 ${HEALTH_BG[project.health] ?? HEALTH_BG.unknown}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                    <span className={`text-xs font-medium uppercase tracking-wide ${HEALTH_COLOR[project.health]}`}>
                      ● {project.health}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{project.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">
                      GitHub ↗
                    </a>
                  )}
                  <button onClick={fetchAll} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">
                    🔄 Refresh
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => setFilterSt(filterStatus === s ? '' : s)}
                    className={`text-center p-3 rounded-lg border transition-colors cursor-pointer ${
                      filterStatus === s ? 'border-blue-500 bg-blue-950' : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}>
                    <div className="text-xl font-bold text-white">{byStatus(s)}</div>
                    <div className="text-gray-400 text-xs capitalize">{s}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-lg">
                {filtered.length} {filterStatus ? filterStatus : 'total'} task{filtered.length !== 1 ? 's' : ''}
              </h2>
              {filterStatus && (
                <button onClick={() => setFilterSt('')} className="text-blue-400 text-sm hover:underline">
                  Clear filter
                </button>
              )}
            </div>

            <div className="space-y-3">
              {filtered.length === 0 && (
                <div className="text-center text-gray-600 py-12 border border-dashed border-gray-800 rounded-xl">
                  No {filterStatus || ''} tasks for this project.
                </div>
              )}
              {filtered.map(task => (
                <div key={task.id} className="bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-600 p-4 flex items-start gap-4 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${URGENCY_DOT[task.urgency] ?? 'bg-gray-600'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-500 text-xs font-mono">{task.id}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_COLORS[task.status] ?? 'bg-gray-800 text-gray-400'}`}>
                        {task.status}
                      </span>
                      {task.is_blocked && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-950 text-red-400">🚫 blocked</span>
                      )}
                    </div>
                    <p className="text-white font-medium mt-0.5">{task.title}</p>
                    {task.description && (
                      <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">{task.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    {task.assignee && (
                      <div className="text-gray-400 text-xs">{task.assignee}</div>
                    )}
                    <div className="text-gray-600 text-xs">
                      {task.status === 'done' ? `Done ${timeAgo(task.completedAt)}` : timeAgo(task.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
