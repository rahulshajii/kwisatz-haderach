"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import {
  Users,
  Play,
  Pause,
  StopCircle,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  WifiOff,
  TrendingUp,
  Award,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, partsRes] = await Promise.all([
        fetch("/api/admin/dashboard"),
        fetch("/api/admin/participants"),
      ]);

      if (dashRes.status === 401 || partsRes.status === 401) {
        router.push("/admin/login");
        return;
      }

      const dashData = await dashRes.json();
      const partsData = await partsRes.json();

      if (dashData.success) {
        setData(dashData);
      }
      if (partsData.success) {
        setParticipants(partsData.participants || []);
      }

      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2500);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleControlAction = async (action: string, confirmPrompt?: string) => {
    if (confirmPrompt && !confirm(confirmPrompt)) return;

    setActionLoading(true);
    try {
      await fetch("/api/admin/quiz/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, confirm: true }),
      });
      await fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  const stats = data?.stats;
  const quiz = data?.quiz;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Header & Status Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                PRAGYAN 2026 • ASIET
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">Department of Computer Applications</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              KWISATZ HADERACH
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live Monitoring & Central Command Console (Auto-syncs every 2.5s)
            </p>
          </div>

          {/* Quiz State Pill & Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-mono text-xs font-bold flex items-center space-x-2 shadow-sm">
              <span
                className={`w-2 h-2 rounded-full ${
                  quiz?.status === "RUNNING"
                    ? "bg-emerald-400 animate-ping"
                    : quiz?.status === "PAUSED"
                    ? "bg-amber-400"
                    : "bg-slate-400"
                }`}
              />
              <span>STATUS: {quiz?.status || "WAITING"}</span>
            </div>

            {quiz?.status === "WAITING" && (
              <button
                onClick={() => handleControlAction("START_QUIZ", "Start quiz for all registered participants now?")}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>START QUIZ</span>
              </button>
            )}

            {quiz?.status === "RUNNING" && (
              <>
                <button
                  onClick={() => handleControlAction("PAUSE_QUIZ")}
                  disabled={actionLoading}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>PAUSE</span>
                </button>
                <button
                  onClick={() => handleControlAction("END_QUIZ", "Are you sure you want to end the round? Ranks will be finalized.")}
                  disabled={actionLoading}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  <span>END QUIZ</span>
                </button>
              </>
            )}

            {quiz?.status === "PAUSED" && (
              <button
                onClick={() => handleControlAction("RESUME_QUIZ")}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>RESUME</span>
              </button>
            )}

            <button
              onClick={() => fetchData()}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 8 Core Metric Cards (Section 25) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {stats?.totalParticipants || 0}
            </span>
            <span className="text-[10px] text-slate-500">Participants</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">
              Joined
            </span>
            <span className="text-2xl font-black text-sky-600 mt-1 block">
              {stats?.joinedCount || 0}
            </span>
            <span className="text-[10px] text-slate-500">Connected</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
              Running
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {stats?.activeCount || 0}
            </span>
            <span className="text-[10px] text-slate-500">Answering</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
              Completed
            </span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">
              {stats?.completedCount || 0}
            </span>
            <span className="text-[10px] text-slate-500">Finished</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
              Failed
            </span>
            <span className="text-2xl font-black text-rose-600 mt-1 block">
              {stats?.failedCount || 0}
            </span>
            <span className="text-[10px] text-slate-500">Anti-cheat</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
              Disconnected
            </span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {stats?.disconnectedCount || 0}
            </span>
            <span className="text-[10px] text-slate-500">&gt;40s idle</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
              Avg Score
            </span>
            <span className="text-2xl font-black text-indigo-600 mt-1 block">
              {stats?.avgScore || 0}
            </span>
            <span className="text-[10px] text-slate-500">pts</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
              Highest
            </span>
            <span className="text-2xl font-black text-purple-600 mt-1 block">
              {stats?.highestScore || 0}
            </span>
            <span className="text-[10px] text-slate-500">pts</span>
          </div>
        </div>

        {/* Live Participant Table (Section 26) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Live Participant Status
              </h2>
              <p className="text-xs text-slate-500">
                Real-time tracking of answering progress, connection, and anti-cheat alerts
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-400">
                Last synced at: {lastUpdated || "--:--"}
              </span>
              <Link
                href="/admin/participants"
                className="text-xs font-bold text-sky-600 hover:text-sky-700 inline-flex items-center ml-2"
              >
                Manage All &rarr;
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4">Unique Code</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Question</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Anti-Cheat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No participants registered yet.
                    </td>
                  </tr>
                ) : (
                  participants.map((p, idx) => {
                    let statusBadge = "bg-slate-100 text-slate-700";
                    if (p.status === "ACTIVE") statusBadge = "bg-emerald-50 text-emerald-700 border border-emerald-200";
                    if (p.status === "COMPLETED") statusBadge = "bg-sky-50 text-sky-700 border border-sky-200";
                    if (p.status === "FAILED" || p.status === "TERMINATED") statusBadge = "bg-rose-50 text-rose-700 border border-rose-200";
                    if (p.status === "DISCONNECTED") statusBadge = "bg-amber-50 text-amber-700 border border-amber-200";

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {p.rank ? `#${p.rank}` : `—`}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          {p.failReason && (
                            <span className="text-[10px] text-rose-600 block truncate max-w-xs">
                              {p.failReason}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 font-bold">
                          {p.uniqueCode}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {p.score.toFixed(1)}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          Q{p.currentQuestion} / {quiz?.questionCount || 20}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {(p.totalTimeMs / 1000).toFixed(1)}s
                        </td>
                        <td className="py-3 px-4">
                          {p.warningCount > 0 ? (
                            <span className="inline-flex items-center text-rose-600 font-bold text-[11px]">
                              <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                              {p.warningCount} warn
                            </span>
                          ) : (
                            <span className="text-emerald-600 text-[11px] font-medium">Clean</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
