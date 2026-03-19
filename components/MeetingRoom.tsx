'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';

interface Message {
  timestamp: string;
  from: string;
  to: string;
  message: string;
  type?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-194a.up.railway.app';
const ROOM_ID = 'main-office';

const AGENT_COLOR: Record<string, string> = {
  aeva:   'bg-blue-900 text-blue-200',
  clara:  'bg-purple-900 text-purple-200',
  system: 'bg-gray-700 text-gray-300',
  user:   'bg-green-900 text-green-200',
};

function agentBadge(name: string) {
  return AGENT_COLOR[name?.toLowerCase()] ?? 'bg-gray-700 text-gray-300';
}

export default function MeetingRoom() {
  const [messages, setMessages]     = useState<Message[]>([]);
  const [loading, setLoading]       = useState(true);
  const [sending, setSending]       = useState(false);
  const [newMsg, setNewMsg]         = useState('');
  const [fromName, setFromName]     = useState('user');
  const [toName, setToName]         = useState('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  async function fetchMessages(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/office/meeting-room/${ROOM_ID}?limit=60`);
      const data = res.ok ? await res.json() : [];
      setMessages(Array.isArray(data) ? data : []);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }

  useEffect(() => {
    fetchMessages();
    const t = setInterval(() => fetchMessages(true), 10_000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setSending(true);
    try {
      const body = { room_id: ROOM_ID, from: fromName || 'user', to: toName || 'all', message: newMsg };
      await fetch(`${API_URL}/api/office/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setMessages(prev => [...prev, { ...body, timestamp: new Date().toISOString(), type: 'message' }]);
      setNewMsg('');
    } finally {
      setSending(false);
    }
  }

  function fmt(ts: string) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 flex flex-col" style={{ height: '520px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏛️</span>
          <span className="text-white font-semibold">Main Office</span>
          <span className="text-xs text-gray-500">general coordination</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-xs">live</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && <div className="text-gray-600 text-sm text-center py-8">Loading transcript…</div>}
        {!loading && messages.length === 0 && (
          <div className="text-gray-600 text-sm text-center py-8">No messages yet. Be the first to speak.</div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 ${agentBadge(msg.from)}`}>
              {msg.from}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-gray-200 text-sm leading-relaxed">{msg.message}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-gray-600 text-xs">{fmt(msg.timestamp)}</span>
                {msg.to && msg.to !== 'all' && (
                  <span className="text-gray-600 text-xs">→ {msg.to}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compose form */}
      <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-800">
        <div className="flex gap-2 mb-2">
          <input
            type="text" value={fromName} onChange={e => setFromName(e.target.value)}
            placeholder="From (you)" maxLength={20}
            className="w-28 bg-gray-800 text-gray-300 border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
          />
          <span className="text-gray-600 text-xs self-center">→</span>
          <input
            type="text" value={toName} onChange={e => setToName(e.target.value)}
            placeholder="To (all)" maxLength={20}
            className="w-28 bg-gray-800 text-gray-300 border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)}
            placeholder="Type a message…" disabled={sending}
            className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <button type="submit" disabled={sending || !newMsg.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors">
            {sending ? '…' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
