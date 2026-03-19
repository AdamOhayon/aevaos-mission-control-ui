'use client';

import AgentStatus from '@/components/AgentStatus';
import ActivityFeed from '@/components/ActivityFeed';
import MeetingRoom from '@/components/MeetingRoom';

export default function OfficePage() {
  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">🏢 Virtual Office</h1>
          <p className="text-gray-400 mt-1">Live agent coordination, activity monitoring, and team communication</p>
        </div>

        {/* Top Section: Agent Status + Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <AgentStatus />
          <ActivityFeed />
        </div>

        {/* Bottom Section: Meeting Room */}
        <MeetingRoom />
      </div>
    </div>
  );
}

