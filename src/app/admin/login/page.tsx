"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, ArrowRight, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please enter username and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed.");
        setLoading(false);
        return;
      }

      router.push("/admin/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4">
      <div className="max-w-md mx-auto w-full pt-4">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Participant Portal
        </Link>
      </div>

      <div className="max-w-md mx-auto w-full my-auto py-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 text-slate-950 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-sky-500/20 font-black">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Admin Coordinator Login
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            KWISATZ HADERACH • PRAGYAN 2026
          </p>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm shadow-lg shadow-sky-500/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:bg-slate-700 disabled:text-slate-400"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>ACCESS DASHBOARD</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-700/60 text-center">
            <span className="text-[11px] text-slate-400">
              Department of Computer Applications • ASIET
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full text-center pb-2 text-[11px] text-slate-500">
        Pragyan 2026 Admin Management Console
      </div>
    </main>
  );
}
