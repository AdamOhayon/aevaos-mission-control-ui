'use client';

import { useState, useEffect, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-194a.up.railway.app';

interface TelegramMessage {
  timestamp: string;
  from: string;
  to: string;
  message: string;
  type?: string; // 'voice' | 'text' | 'message'
}

function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function fmt(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const FROM_ADAM = ['adam', 'user', 'you'];

export default function TelegramLog() {
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [loading, setLoading]   = useState(true);
  const [lastFetch, setLast]    = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  async function fetchMessages(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API}/api/office/meeting-room/telegram?limit=80`);
      const data = res.ok ? await res.json() : [];
      setMessages(Array.isArray(data) ? data : []);
      setLast(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch { /* noop */ }
    finally { setLoading(false); }
  }

  useEffect(() => {
    fetchMessages();
    const t = setInterval(() => fetchMessages(true), 15_000);
    // Also respond to office page's global refresh event
    const handler = () => fetchMessages(true);
    window.addEventListener('aevaos:refresh', handler);
    return () => { clearInterval(t); window.removeEventListener('aevaos:refresh', handler); };
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isAdam = (name: string) => FROM_ADAM.includes(name?.toLowerCase());

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 flex flex-col" style={{ height: '480px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">✈️</span>
          <div>
            <span className="text-white font-semibold text-sm">Telegram — Aeva</span>
            <p className="text-gray-500 text-xs">Live conversation log</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastFetch && <span className="text-gray-600 text-xs">Updated {lastFetch}</span>}
          <button onClick={() => fetchMessages(true)} className="text-gray-600 hover:text-gray-400 text-xs transition-colors">🔄</button>
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && (
          <div className="text-gray-600 text-sm text-center py-10">Loading conversation…</div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-gray-600 text-sm">No messages yet.</p>
            <p className="text-gray-700 text-xs mt-1">Aeva will log Telegram exchanges here automatically.</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const fromAdamSide = isAdam(msg.from);
          const isVoice = msg.type === 'voice';
          const isSystem = msg.type === 'system' || msg.from === 'system';

          if (isSystem) {
            return (
              <div key={i} className="text-center">
                <span className="text-gray-600 text-xs bg-gray-800 px-3 py-1 rounded-full">{msg.message}</span>
              </div>
            );
          }

          return (
            <div key={i} className={`flex gap-2 ${fromAdamSide ? 'justify-end' : 'justify-start'}`}>
              {!fromAdamSide && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm">
                  🌀
                </div>
              )}
              <div className={`max-w-[75%] group`}>
                {/* Sender label */}
                {!fromAdamSide && (
                  <p className="text-blue-400 text-xs font-medium mb-0.5 pl-1">Aeva</p>
                )}
                {/* Bubble */}
                <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  fromAdamSide
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                }`}>
                  {isVoice && (
                    <span className="mr-1.5 opacity-70">🎙️</span>
                  )}
                  {msg.message}
                </div>
                {/* Timestamp */}
                <p className={`text-gray-600 text-xs mt-0.5 ${fromAdamSide ? 'text-right pr-1' : 'pl-1'}`}>
                  {fmt(msg.timestamp)} · {timeAgo(msg.timestamp)}
                </p>
              </div>
              {fromAdamSide && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-sm">
                  👤
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-800 shrink-0">
        <p className="text-gray-700 text-xs text-center">
          Messages sent via Telegram appear here automatically · read-only view
        </p>
      </div>
    </div>
  );
}
