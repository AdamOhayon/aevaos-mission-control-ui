'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-194a.up.railway.app';

interface Project { id: string; name: string; description: string; status: string; priority: number; github?: string; health: string; lastActivity?: string; }
interface Task { id: string; title: string; description: string; status: string; assignee: string; urgency: string; is_blocked: boolean; completedAt?: string; createdAt?: string; }

const HEALTH_COLORS: Record<string, { text: string; border: string; bg: string; dot: string }> = {
  green:   { text: 'text-green-400', border: 'border-green-500/20', bg: 'bg-green-500/5', dot: 'bg-green-400' },
  yellow:  { text: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5', dot: 'bg-amber-400' },
  red:     { text: 'text-red-400',   border: 'border-red-500/20',   bg: 'bg-red-500/5',   dot: 'bg-red-400' },
  unknown: { text: 'text-[var(--aeva-text-muted)]', border: 'border-[var(--aeva-border)]', bg: 'bg-[var(--aeva-surface)]', dot: 'bg-gray-500' },
};

const STATUS_BADGE: Record<string, string> = {
  done:          'bg-green-500/10 text-green-400 border-green-500/20',
  'in-progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ready:         'bg-[var(--aeva-surface-2)] text-[var(--aeva-text-dim)] border-[var(--aeva-border)]',
  blocked:       'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject]       = useState<Project | null>(null);
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [readme, setReadme]         = useState('');
  const [readmeExists, setReadmeEx] = useState(false);
  const [tab, setTab]               = useState<'tasks' | 'readme'>('tasks');
  const [editing, setEditing]       = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving]         = useState(false);
  const [loading, setLoading]       = useState(true);
  const [filterSt, setFilterSt]     = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [projRes, taskRes, readmeRes] = await Promise.all([
        fetch(`${API}/api/projects`),
        fetch(`${API}/api/tasks?project=${encodeURIComponent(projectId)}`),
        fetch(`${API}/api/projects/${projectId}/readme`),
      ]);
      const projData = await projRes.json();
      const taskData = await taskRes.json();
      const readmeData = await readmeRes.json();

      setProject(projData.projects?.find((p: Project) => p.id === projectId) ?? null);
      setTasks(taskData.tasks ?? []);
      setReadme(readmeData.content ?? '');
      setReadmeEx(readmeData.exists ?? false);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [projectId]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(fetchAll, 30_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchAll]);

  async function saveReadme() {
    setSaving(true);
    try {
      await fetch(`${API}/api/projects/${projectId}/readme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      setReadme(editContent);
      setReadmeEx(true);
      setEditing(false);
    } finally { setSaving(false); }
  }

  function timeAgo(ts?: string) {
    if (!ts) return '—';
    const d = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    return `${d}d ago`;
  }

  const filtered = filterSt ? tasks.filter(t => t.status === filterSt) : tasks;
  const byStatus = (s: string) => tasks.filter(t => t.status === s).length;
  const health = HEALTH_COLORS[project?.health ?? 'unknown'] ?? HEALTH_COLORS.unknown;

  return (
    <div className="min-h-screen bg-[var(--aeva-bg)] pt-16 grid-bg">
      <div className="max-w-5xl mx-auto px-6 py-8 relative z-10">

        <Link href="/projects" className="text-[var(--aeva-text-muted)] hover:text-white text-xs mb-6 inline-flex items-center gap-1.5 transition-colors uppercase tracking-wider">
          ← Projects
        </Link>

        {loading && <div className="text-[var(--aeva-text-dim)] text-center py-20 animate-in">Loading…</div>}

        {project && (
          <div className="animate-in">
            {/* Hero header */}
            <div className={`card-glow p-6 mb-6 ${health.bg} border ${health.border}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border" style={{ borderColor: 'currentColor' }}>
                      <span className={`w-2 h-2 rounded-full ${health.dot}`} style={{ boxShadow: `0 0 6px currentColor` }} />
                      <span className={`text-[10px] font-medium uppercase tracking-wider ${health.text}`}>{project.health}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${
                      project.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      project.status === 'paused' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-[var(--aeva-surface-2)] text-[var(--aeva-text-dim)] border-[var(--aeva-border)]'
                    }`}>{project.status}</span>
                  </div>
                  <p className="text-[var(--aeva-text-dim)] text-sm">{project.description}</p>
                  <p className="text-[var(--aeva-text-muted)] text-xs mt-1">Last activity: {timeAgo(project.lastActivity)} · Priority #{project.priority}</p>
                </div>
                <div className="flex items-center gap-2">
                  {project.github && (
                    <a href={`https://github.com/${project.github}`} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 glass rounded-lg text-[var(--aeva-text-dim)] hover:text-white text-xs transition-colors">
                      GitHub ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 mt-5">
                {['ready', 'in-progress', 'done', 'blocked'].map(s => (
                  <button key={s} onClick={() => setFilterSt(filterSt === s ? '' : s)}
                    className={`text-center p-3 rounded-xl border transition-all cursor-pointer ${
                      filterSt === s ? 'border-blue-500/40 bg-blue-500/10 shadow-[0_0_12px_rgba(59,130,246,0.1)]' : `border-[var(--aeva-border)] bg-[var(--aeva-surface)] hover:border-[var(--aeva-border-hover)]`
                    }`}>
                    <div className="text-xl font-bold text-white">{byStatus(s)}</div>
                    <div className="text-[var(--aeva-text-muted)] text-[10px] capitalize">{s}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6">
              {(['tasks', 'readme'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${
                    tab === t
                      ? 'bg-blue-600/20 text-white shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                      : 'text-[var(--aeva-text-muted)] hover:text-white hover:bg-white/[0.04]'
                  }`}>
                  {t === 'tasks' ? `✅ Tasks (${tasks.length})` : `📄 README ${readmeExists ? '' : '(empty)'}`}
                </button>
              ))}
            </div>

            {/* Tasks tab */}
            {tab === 'tasks' && (
              <div className="space-y-2 animate-in">
                {filtered.length === 0 && (
                  <div className="card-glow text-center py-12 text-[var(--aeva-text-muted)] text-sm">
                    No {filterSt || ''} tasks for this project.
                  </div>
                )}
                {filtered.map((task, i) => (
                  <div key={task.id} className="card-glow p-4 flex items-start gap-4 animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      task.urgency === 'high' ? 'bg-red-400' : task.urgency === 'medium' ? 'bg-amber-400' : 'bg-green-400'
                    }`} style={{ boxShadow: task.urgency === 'high' ? '0 0 6px #ef4444' : 'none' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[var(--aeva-text-muted)] text-[10px] font-mono">{task.id}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${STATUS_BADGE[task.status] ?? ''}`}>{task.status}</span>
                        {task.is_blocked && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">🚫 blocked</span>}
                      </div>
                      <p className="text-white font-medium text-sm mt-1">{task.title}</p>
                      {task.description && <p className="text-[var(--aeva-text-dim)] text-xs mt-0.5 line-clamp-1">{task.description}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      {task.assignee && <div className="text-[var(--aeva-text-dim)] text-[10px]">{task.assignee}</div>}
                      <div className="text-[var(--aeva-text-muted)] text-[10px]">{task.status === 'done' ? `Done ${timeAgo(task.completedAt)}` : timeAgo(task.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* README tab */}
            {tab === 'readme' && (
              <div className="animate-in">
                {!editing ? (
                  <div className="card-glow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold text-sm">📄 Project README</h3>
                      <button onClick={() => { setEditContent(readme); setEditing(true); }}
                        className="px-3 py-1.5 glass rounded-lg text-[var(--aeva-text-dim)] hover:text-white text-xs transition-colors">
                        ✏️ Edit
                      </button>
                    </div>
                    {readme ? (
                      <div className="prose prose-invert prose-sm max-w-none
                        prose-headings:text-white prose-headings:font-semibold
                        prose-p:text-[var(--aeva-text)] prose-p:leading-relaxed
                        prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                        prose-code:text-cyan-400 prose-code:bg-[var(--aeva-surface-2)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                        prose-pre:bg-[var(--aeva-surface-2)] prose-pre:border prose-pre:border-[var(--aeva-border)] prose-pre:rounded-xl
                        prose-strong:text-white
                        prose-li:text-[var(--aeva-text)]
                        prose-hr:border-[var(--aeva-border)]
                        prose-blockquote:border-[var(--aeva-blue)] prose-blockquote:text-[var(--aeva-text-dim)]
                        prose-table:text-[var(--aeva-text)] prose-th:text-white prose-th:border-[var(--aeva-border)] prose-td:border-[var(--aeva-border)]
                      ">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{readme}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-4xl mb-3">📝</p>
                        <p className="text-[var(--aeva-text-dim)] text-sm">No README yet.</p>
                        <button onClick={() => { setEditContent(`# ${project.name}\n\n${project.description}\n\n## Overview\n\n...\n`); setEditing(true); }}
                          className="mt-3 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg text-xs hover:bg-blue-600/30 transition-colors">
                          Create README
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="card-glow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold text-sm">✏️ Editing README</h3>
                      <div className="flex gap-2">
                        <button onClick={() => setEditing(false)}
                          className="px-3 py-1.5 glass rounded-lg text-[var(--aeva-text-dim)] hover:text-white text-xs transition-colors">
                          Cancel
                        </button>
                        <button onClick={saveReadme} disabled={saving}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors">
                          {saving ? 'Saving…' : '💾 Save'}
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={20}
                      className="w-full bg-[var(--aeva-surface-2)] text-[var(--aeva-text)] border border-[var(--aeva-border)] rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-[var(--aeva-blue)] focus:shadow-[0_0_12px_rgba(59,130,246,0.1)] transition-all resize-y"
                      placeholder="# Project Title\n\nDescribe your project here..."
                    />
                    <p className="text-[var(--aeva-text-muted)] text-[10px] mt-2">Supports full Markdown: headings, code blocks, tables, links, lists</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
