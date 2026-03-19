import Link from "next/link";
import SearchWidget from "@/components/SearchWidget";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">🌀 Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Intelligent search and workflow management powered by qmd
          </p>
        </div>

        {/* Search Widget */}
        <SearchWidget />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 mt-8">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Indexed Documents</p>
                <p className="text-3xl font-bold text-white">79</p>
              </div>
              <div className="text-4xl">📚</div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Collections</p>
                <p className="text-3xl font-bold text-white">3</p>
              </div>
              <div className="text-4xl">🗂️</div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Search Engine</p>
                <p className="text-2xl font-bold text-white">qmd</p>
              </div>
              <div className="text-4xl">🧠</div>
            </div>
          </div>
        </div>

        {/* Collections Info */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">📁 Collections</h2>
          <div className="space-y-3">
            {[
              { icon: "📝", name: "memory", desc: "Daily logs and notes" },
              { icon: "🏠", name: "workspace", desc: "Core files (AGENTS.md, TOOLS.md, etc.)" },
              { icon: "🚀", name: "aeva-os", desc: "Project documentation" },
            ].map((c) => (
              <div key={c.name} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <span className="text-2xl">{c.icon}</span>
                <div>
                  <p className="font-semibold text-white">{c.name}</p>
                  <p className="text-sm text-gray-400">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links to new pages */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/tasks", icon: "✅", label: "Tasks" },
            { href: "/projects", icon: "🚀", label: "Projects" },
            { href: "/ideas", icon: "💡", label: "Ideas" },
            { href: "/analytics", icon: "📊", label: "Analytics" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-blue-600 hover:bg-gray-800 transition-colors"
            >
              <span className="text-3xl">{item.icon}</span>
              <span className="text-gray-300 text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
