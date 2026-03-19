"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api-production-194a.up.railway.app";

const NAV_ITEMS = [
  { href: "/",          label: "Dashboard", icon: "🌀" },
  { href: "/briefing",  label: "Briefing",  icon: "📋" },
  { href: "/office",    label: "Office",    icon: "🏢" },
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
    localStorage.removeItem("aevaos_session");
    router.replace("/login");
  }

  function getSession() {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem("aevaos_session") || "null");
    } catch {
      return null;
    }
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">🌀</span>
        <span className="text-white font-bold text-lg tracking-tight">AevaOS</span>
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <span>{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Right side: alert bell + user */}
      <div className="flex items-center gap-3">
        {/* Alert bell */}
        <button
          onClick={() => router.push("/tasks")}
          className="relative p-1.5 text-gray-400 hover:text-white transition-colors"
          title={alertCount > 0 ? `${alertCount} alert${alertCount > 1 ? "s" : ""}` : "No alerts"}
        >
          <span className="text-lg">{alertCount > 0 ? "🔔" : "🔕"}</span>
          {alertCount > 0 && (
            <span className={`absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${
              hasCritical ? "bg-red-500" : "bg-yellow-500"
            }`}>
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </button>

        <span className="text-gray-400 text-sm hidden md:inline">
          {getSession()?.username ?? ""}
        </span>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1 rounded"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
