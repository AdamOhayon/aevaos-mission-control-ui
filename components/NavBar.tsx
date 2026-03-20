"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";

const NAV_ITEMS = [
  { href: "/",          label: "Dashboard", icon: "🌀" },
  { href: "/briefing",  label: "Briefing",  icon: "📋" },
  { href: "/office",    label: "Office",    icon: "🏢" },
  { href: "/agents",    label: "Agents",    icon: "🤖" },
  { href: "/dispatch",  label: "Dispatch",  icon: "⚡" },
  { href: "/tasks",     label: "Tasks",     icon: "✅" },
  { href: "/projects",  label: "Projects",  icon: "🚀" },
  { href: "/ideas",     label: "Ideas",     icon: "💡" },
  { href: "/credits",   label: "Credits",   icon: "💰" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/blockers",  label: "Blockers",  icon: "🚫" },
  { href: "/search",    label: "Search",    icon: "🔍" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [alertCount, setAlertCount] = useState(0);
  const [hasCritical, setHasCritical] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll detection for glass effect intensity
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Poll alerts every 60s
  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch(`${API}/api/alerts`);
        if (res.ok) {
          const data = await res.json();
          setAlertCount(data.count ?? 0);
          setHasCritical((data.critical ?? 0) > 0);
        }
      } catch { /* ignore */ }
    }
    fetchAlerts();
    const t = setInterval(fetchAlerts, 60_000);
    return () => clearInterval(t);
  }, []);

  function handleLogout() {
    localStorage.removeItem('aevaos_token');
    localStorage.removeItem('aevaos_session');
    document.cookie = 'aevaos_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.replace('/login');
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-[#050510]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20'
        : 'bg-[#050510]/50 backdrop-blur-md border-b border-transparent'
    }`}>
      <div className="max-w-[1440px] mx-auto px-4 py-2.5 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <span className="text-2xl animate-float" style={{ animationDuration: '5s' }}>🌀</span>
          <div className="flex flex-col">
            <span className="text-white font-bold text-sm tracking-tight leading-none group-hover:text-blue-400 transition-colors">AevaOS</span>
            <span className="text-[10px] text-[var(--aeva-text-muted)] tracking-widest uppercase leading-none mt-0.5">Mission Control</span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none mx-4">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  active
                    ? 'text-white bg-blue-600/20 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                    : 'text-[var(--aeva-text-dim)] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {active && (
                  <span className="absolute inset-x-2 -bottom-2.5 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full" />
                )}
                <span className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>{item.icon}</span>
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Alert bell */}
          <button
            onClick={() => router.push("/tasks")}
            className="relative p-1.5 text-[var(--aeva-text-dim)] hover:text-white transition-colors"
            title={alertCount > 0 ? `${alertCount} alert${alertCount > 1 ? "s" : ""}` : "No alerts"}
          >
            <span className="text-lg">{alertCount > 0 ? "🔔" : "🔕"}</span>
            {alertCount > 0 && (
              <span className={`absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                hasCritical ? "bg-red-500 animate-pulse-glow" : "bg-amber-500"
              }`} style={{ color: hasCritical ? '#ef4444' : '#f59e0b' }}>
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </button>

          <div className="w-px h-5 bg-white/[0.06]" />

          <button
            onClick={handleLogout}
            className="text-[10px] text-[var(--aeva-text-muted)] hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10 uppercase tracking-wider font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
