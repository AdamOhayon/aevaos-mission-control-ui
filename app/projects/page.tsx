"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";

const HEALTH_CONFIG: Record<string, { label: string; dot: string; bg: string }> = {
  green:   { label: "Healthy",  dot: "bg-green-400",  bg: "border-green-700" },
  yellow:  { label: "At Risk",  dot: "bg-yellow-400", bg: "border-yellow-700" },
  red:     { label: "Critical", dot: "bg-red-400",    bg: "border-red-700" },
  unknown: { label: "Unknown",  dot: "bg-gray-500",   bg: "border-gray-700" },
};

const STATUS_BADGE: Record<string, string> = {
  active:    "bg-green-900 text-green-300",
  paused:    "bg-yellow-900 text-yellow-300",
  completed: "bg-blue-900 text-blue-300",
  archived:  "bg-gray-800 text-gray-400",
};

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority: number;
  github?: string | null;
  health?: string;
  lastActivity?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/projects`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: Project[] = data.projects ?? [];
      setProjects(list.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    fetchProjects();
    timerRef.current = setInterval(fetchProjects, 60_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchProjects]);

  function timeAgo(ts?: string) {
    if (!ts) return "—";
    const diff = Date.now() - new Date(ts).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">🚀 Projects</h1>
            <p className="text-gray-400 mt-1">Portfolio view — {projects.length} projects</p>
          </div>
          <button onClick={fetchProjects} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">🔄 Refresh</button>
        </div>

        {loading && <div className="text-gray-400 text-center py-20">Loading…</div>}
        {error && <div className="text-red-400 text-center py-20">Error: {error}</div>}

        {!loading && !error && (
          <div className="space-y-3">
            {projects.map((project) => {
              const health = HEALTH_CONFIG[project.health ?? "unknown"] ?? HEALTH_CONFIG.unknown;
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className={`block bg-gray-900 rounded-xl border border-gray-800 border-l-4 ${health.bg} p-5 hover:border-gray-600 hover:bg-gray-800/70 transition-colors group`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-white font-semibold text-lg group-hover:text-blue-300 transition-colors">{project.name}</h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[project.status] ?? STATUS_BADGE.archived}`}>
                          {project.status}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-gray-400 text-sm">{project.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        {project.github && (
                          <a
                            href={`https://github.com/${project.github}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <span>🐙</span>
                            <span>{project.github}</span>
                          </a>
                        )}
                        <span>Priority #{project.priority}</span>
                        <span>Last active: {timeAgo(project.lastActivity)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${health.dot}`} />
                        <span className="text-xs text-gray-400">{health.label}</span>
                      </div>
                      <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">View tasks →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
