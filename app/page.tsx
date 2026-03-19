import Link from "next/link";
import SearchWidget from "@/components/SearchWidget";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header with Navigation */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              🌀 AevaOS Mission Control
            </h1>
            <nav className="flex gap-4">
              <Link
                href="/"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/office"
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Office
              </Link>
            </nav>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Intelligent search and workflow management powered by qmd
          </p>
        </header>

        {/* Search Widget */}
        <SearchWidget />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Indexed Documents</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">79</p>
              </div>
              <div className="text-4xl">📚</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Collections</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">3</p>
              </div>
              <div className="text-4xl">🗂️</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Search Engine</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">qmd</p>
              </div>
              <div className="text-4xl">🧠</div>
            </div>
          </div>
        </div>

        {/* Collections Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            📁 Collections
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-2xl">📝</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">memory</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Daily logs and notes</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-2xl">🏠</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">workspace</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Core files (AGENTS.md, TOOLS.md, etc.)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-2xl">🚀</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">aeva-os</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Project documentation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            ✨ Features
          </h2>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>Semantic Search:</strong> Find content by meaning, not just keywords</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>BM25 Keyword Search:</strong> Fast, traditional search when you know what you&apos;re looking for</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>Daily Briefing Integration:</strong> Automatic context discovery for tasks</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>Task System Integration:</strong> Related work suggestions when creating tasks</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>Auto-Prioritization:</strong> Context-aware task scoring</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
