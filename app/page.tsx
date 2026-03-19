import Link from "next/link";
import SearchWidget from "@/components/SearchWidget";

const QUICK_LINKS = [
  { href: "/briefing",  icon: "📋", label: "Briefing" },
  { href: "/tasks",     icon: "✅", label: "Tasks" },
  { href: "/projects",  icon: "🚀", label: "Projects" },
  { href: "/ideas",     icon: "💡", label: "Ideas" },
  { href: "/analytics", icon: "📊", label: "Analytics" },
  { href: "/agents",    icon: "🤖", label: "Agents" },
  { href: "/blockers",  icon: "🚫", label: "Blockers" },
  { href: "/search",    icon: "🔍", label: "Search" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">🌀 AevaOS</h1>
          <p className="text-gray-400 mt-1">Mission Control · AI agent orchestration</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <SearchWidget />
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Search Engine</p>
              <p className="text-2xl font-bold text-white">qmd</p>
              <p className="text-xs text-gray-600 mt-0.5">79 docs indexed</p>
            </div>
            <span className="text-4xl">🧠</span>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Collections</p>
              <p className="text-2xl font-bold text-white">3</p>
              <p className="text-xs text-gray-600 mt-0.5">memory · workspace · aeva-os</p>
            </div>
            <span className="text-4xl">🗂️</span>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">API Version</p>
              <p className="text-2xl font-bold text-white">v1.3</p>
              <p className="text-xs text-gray-600 mt-0.5">SSE stream · briefing · search</p>
            </div>
            <span className="text-4xl">⚡</span>
          </div>
        </div>

        {/* Quick links grid */}
        <div>
          <h2 className="text-gray-400 text-xs uppercase tracking-widest mb-3">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_LINKS.map(item => (
              <Link key={item.href} href={item.href}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-blue-600 hover:bg-gray-800 transition-all group">
                <span className="text-3xl group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="text-gray-300 text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
