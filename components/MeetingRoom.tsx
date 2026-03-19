'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  timestamp: string;
  from: string;
  to: string;
  message: string;
  type: 'message' | 'system';
}

interface MeetingRoomData {
  rooms: Record<string, {
    id: string;
    name: string;
    description: string;
    participants: string[];
    active: boolean;
  }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-194a.up.railway.app';

export default function MeetingRoom() {
  const [roomInfo, setRoomInfo] = useState<MeetingRoomData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  const roomId = 'main-office';

  const fetchRoomInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/api/office/meeting-room`);
      if (!response.ok) throw new Error('Failed to fetch room info');
      const data = await response.json();
      setRoomInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/office/meeting-room/${roomId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data);
      setError(null);
      
      // Auto-scroll to bottom if new messages
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
    fetchRoomInfo();
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const message = {
        timestamp: new Date().toISOString(),
        from: 'You',
        to: 'all',
        message: newMessage.trim(),
        type: 'message' as const,
      };

      const response = await fetch(`${API_URL}/api/office/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: roomId,
          ...message,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      setNewMessage('');
      // Immediately fetch to show the new message
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getParticipantColor = (participant: string) => {
    const colors: Record<string, string> = {
      aeva: 'text-blue-600 dark:text-blue-400',
      clara: 'text-purple-600 dark:text-purple-400',
      you: 'text-green-600 dark:text-green-400',
    };
    return colors[participant.toLowerCase()] || 'text-gray-600 dark:text-gray-400';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          💬 Meeting Room - Main Office
        </h2>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const mainOffice = roomInfo?.rooms['main-office'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col h-[600px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            💬 Meeting Room - {mainOffice?.name || 'Main Office'}
          </h2>
          {mainOffice && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {mainOffice.description}
            </p>
          )}
        </div>
        {mainOffice && (
          <div className="text-sm">
            <div className="text-gray-600 dark:text-gray-400 mb-1">Participants:</div>
            <div className="flex gap-2">
              {mainOffice.participants.map((participant) => (
                <span
                  key={participant}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-semibold capitalize"
                >
                  {participant}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.type === 'system' ? 'justify-center' : 'justify-start'}`}
          >
            {msg.type === 'system' ? (
              <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400">
                {msg.message}
              </div>
            ) : (
              <div className="max-w-[70%] bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-bold text-sm ${getParticipantColor(msg.from)}`}>
                    {msg.from}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimestamp(msg.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {msg.message}
                </p>
              </div>
            )}
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No messages yet. Start the conversation!
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={sending}
          className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
