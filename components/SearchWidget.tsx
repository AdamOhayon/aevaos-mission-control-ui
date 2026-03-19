'use client';

import { useState } from 'react';

interface SearchResult {
  file: string;
  content: string;
  score?: number;
  line?: number;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  collection?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-194a.up.railway.app';

export default function SearchWidget() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<'semantic' | 'keyword'>('semantic');

  const search = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const endpoint = searchType === 'semantic' 
        ? '/api/search/semantic'
        : '/api/search/markdown';
      
      const res = await fetch(
        `${API_URL}${endpoint}?q=${encodeURIComponent(query)}&limit=10`
      );

      if (!res.ok) {
        throw new Error(`Search failed: ${res.statusText}`);
      }

      const data: SearchResponse = await res.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      search();
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-col gap-3">
        {/* Search Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search knowledge base..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={loading}
          />
          <button
            onClick={search}
            disabled={loading || !query.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '...' : '🔍'}
          </button>
        </div>

        {/* Search Type Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setSearchType('semantic')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              searchType === 'semantic'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            🧠 Semantic
          </button>
          <button
            onClick={() => setSearchType('keyword')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              searchType === 'keyword'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            🔤 Keyword
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Found {results.length} result{results.length !== 1 ? 's' : ''}
            </div>
            {results.map((result, i) => (
              <div
                key={i}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 truncate">
                      {result.file}
                      {result.line && (
                        <span className="text-gray-500 dark:text-gray-400 ml-2">
                          :{result.line}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-3">
                      {result.content}
                    </div>
                  </div>
                  {result.score && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {(result.score * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && results.length === 0 && query && !error && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No results found for &quot;{query}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
