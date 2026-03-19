"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

// Simple credential check — replace with real auth when ready
const VALID_USERS: Record<string, string> = {
  aeva: "user123",
  admin: "admin123",
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (VALID_USERS[username] === password) {
        // Store session in localStorage
        localStorage.setItem(
          "aevaos_session",
          JSON.stringify({ username, loginAt: Date.now() })
        );
        router.push("/tasks");
      } else {
        setError("Invalid username or password");
      }
      setLoading(false);
    }, 400);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌀</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AevaOS
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Mission Control Login
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? "Logging in…" : "Login"}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
              Demo Credentials:
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Username: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">aeva</code>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Password: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">user123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
