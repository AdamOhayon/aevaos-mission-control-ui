"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";

interface Project {
  id: string; name: string; description?: string; status: string;
  priority: number; github?: string | null; health?: string; lastActivity?: string;
}

const HEALTH: Record<string, { label: string; dot: string; glow: string }> = {
  green:   { label: "Healthy",  dot: "bg-green-400",  glow: "0 0 8px #10b981" },
  yellow:  { label: "At Risk",  dot: "bg-amber-400",  glow: "0 0 8px #f59e0b" },
  red:     { label: "Critical", dot: "bg-red-400",    glow: "0 0 8px #ef4444" },
  unknown: { label: "Unknown",  dot: "bg-gray-500",   glow: "none" },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/projects`);
      if (!res.ok) return;
      const data = await res.json();
      setProjects((data.projects ?? []).sort((a: Project, b: Project) => (a.priority ?? 99) - (b.priority ?? 99)));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    fetchProjects();
    timerRef.current = setInterval(fetchProjects, 60_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchProjects]);

  function timeAgo(ts?: string) {
    if (!ts) return "—";
    const d = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    return `${d}d ago`;
  }

  const active = projects.filter(p => p.status === 'active');
  const paused = projects.filter(p => p.status !== 'active');

  return (
    <div className="min-h-screen bg-[var(--aeva-bg)] pt-16 grid-bg">
      <div className="max-w-5xl mx-auto px-6 py-8 relative z-10">
        <div className="flex items-center justify-between mb-8 animate-in">
          <div>
            <h1 className="text-3xl font-bold text-white">🚀 Projects</h1>
            <p className="text-[var(--aeva-text-dim)] mt-1 text-sm">
              {projects.length} projects · {active.length} active
            </p>
          </div>
          <button onClick={fetchProjects} className="px-3 py-1.5 glass rounded-lg text-[var(--aeva-text-dim)] hover:text-white text-sm transition-colors">🔄</button>
        </div>

        {loading && <div className="text-[var(--aeva-text-dim)] text-center py-20">Loading…</div>}

        {!loading && (
          <>
            {/* Active projects */}
            {active.length > 0 && (
              <div className="mb-8">
                <h2 className="text-[var(--aeva-text-muted)] text-[10px] uppercase tracking-[0.2em] font-semibold mb-3">Active</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {active.map((project, i) => {
                    const h = HEALTH[project.health ?? 'unknown'] ?? HEALTH.unknown;
                    return (
                      <Link key={project.id} href={`/projects/${project.id}`}
                        className="card-glow p-5 group animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h2 className="text-white font-semibold text-lg group-hover:text-blue-300 transition-colors truncate">{project.name}</h2>
                            {project.description && <p className="text-[var(--aeva-text-dim)] text-xs mt-1 line-clamp-2">{project.description}</p>}
                          </div>
                          <div className="flex items-center gap-1.5 ml-3 shrink-0 px-2 py-1 rounded-full bg-[var(--aeva-surface-2)] border border-[var(--aeva-border)]">
                            <span className={`w-2.5 h-2.5 rounded-full ${h.dot}`} style={{ boxShadow: h.glow }} />
                            <span className="text-[10px] text-[var(--aeva-text-dim)]">{h.label}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-[10px] text-[var(--aeva-text-muted)]">
                          {project.github && (
                            <span className="flex items-center gap-1">
                              <span>🐙</span>
                              <span className="text-blue-400">{project.github.split('/').pop()}</span>
                            </span>
                          )}
                          <span>P{project.priority}</span>
                          <span>{timeAgo(project.lastActivity)}</span>
                          <span className="ml-auto text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Paused/archived projects */}
            {paused.length > 0 && (
              <div>
                <h2 className="text-[var(--aeva-text-muted)] text-[10px] uppercase tracking-[0.2em] font-semibold mb-3">Paused / Archived</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paused.map((project, i) => (
                    <Link key={project.id} href={`/projects/${project.id}`}
                      className="card-glow p-4 group opacity-60 hover:opacity-100 transition-opacity animate-in"
                      style={{ animationDelay: `${(active.length + i) * 0.1}s` }}>
                      <h2 className="text-white font-medium text-sm group-hover:text-blue-300 transition-colors truncate">{project.name}</h2>
                      {project.description && <p className="text-[var(--aeva-text-dim)] text-[10px] mt-0.5 truncate">{project.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--aeva-text-muted)]">
                        <span className="capitalize px-1.5 py-0.5 rounded-full border border-[var(--aeva-border)]">{project.status}</span>
                        <span>{timeAgo(project.lastActivity)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
