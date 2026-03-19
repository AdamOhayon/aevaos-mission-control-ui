'use client';

import { useState, useEffect, useRef } from 'react';

interface Activity {
  timestamp: string;
  agent: string;
  action: string;
  message: string;
  metadata?: Record<string, any>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-194a.up.railway.app';

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  const fetchActivities = async () => {
    try {
      const response = await fetch(`${API_URL}/api/office/activity?limit=50`);
      if (!response.ok) throw new Error('Failed to fetch activities');
      const data = await response.json();
      setActivities(data);
      setError(null);
      
      // Auto-scroll to bottom if new activities
      if (data.length > prevLengthRef.current && scrollRef.current) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
      prevLengthRef.current = data.length;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getAgentColor = (agent: string) => {
    const colors: Record<string, string> = {
      aeva: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      clara: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      system: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    };
    return colors[agent.toLowerCase()] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      task_started: '▶️',
      task_completed: '✅',
      task_blocked: '🚫',
      system_init: '🔧',
      message: '💬',
      collaboration: '🤝',
      decision: '🎯',
      error: '❌',
    };
    return icons[action] || '📌';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          📊 Activity Feed
        </h2>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          📊 Activity Feed
        </h2>
        <div className="text-red-500 dark:text-red-400">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col h-[500px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          📊 Activity Feed
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {activities.length} events
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
      >
        {activities.map((activity, index) => (
          <div
            key={index}
            className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{getActionIcon(activity.action)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getAgentColor(activity.agent)}`}>
                    {activity.agent}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {activity.message}
                </p>
                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-x-2">
                    {Object.entries(activity.metadata).map(([key, value]) => (
                      <span key={key}>
                        <span className="font-semibold">{key}:</span> {String(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No activity yet
          </div>
        )}
      </div>
    </div>
  );
}
