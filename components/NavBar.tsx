"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "🌀" },
  { href: "/office", label: "Office", icon: "🏢" },
  { href: "/tasks", label: "Tasks", icon: "✅" },
  { href: "/projects", label: "Projects", icon: "🚀" },
  { href: "/ideas", label: "Ideas", icon: "💡" },
  { href: "/credits", label: "Credits", icon: "💰" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

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
        <span className="text-white font-bold text-lg tracking-tight">
          AevaOS
        </span>
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <span>{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* User */}
      <div className="flex items-center gap-3">
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
