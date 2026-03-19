'use client';

import { useState, useEffect } from 'react';
import AgentStatus from '@/components/AgentStatus';
import ActivityFeed from '@/components/ActivityFeed';
import MeetingRoom from '@/components/MeetingRoom';
import Link from 'next/link';

export default function OfficePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Navigation */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              🏢 Virtual Office
            </h1>
            <nav className="flex gap-4">
              <Link 
                href="/" 
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/office" 
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Office
              </Link>
            </nav>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Live agent coordination, activity monitoring, and team communication
          </p>
        </header>

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
