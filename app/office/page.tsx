'use client';
import { useEffect, useCallback, useRef } from 'react';
import AgentStatus from '@/components/AgentStatus';
import ActivityFeed from '@/components/ActivityFeed';
import MeetingRoom from '@/components/MeetingRoom';

const REFRESH_INTERVAL = 30_000;

export default function OfficePage() {
  // Auto-refresh by toggling a key — forces child components to remount/refetch
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => {
      // Dispatch a custom event components can listen to for refresh
      window.dispatchEvent(new CustomEvent('aevaos:refresh'));
    }, REFRESH_INTERVAL);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">🏢 Virtual Office</h1>
            <p className="text-gray-400 mt-1">Live agent coordination · auto-refreshes every 30s</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <AgentStatus />
          <ActivityFeed />
        </div>

        <MeetingRoom />
      </div>
    </div>
  );
}
