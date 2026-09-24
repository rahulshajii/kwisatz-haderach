"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import {
  Trophy,
  Award,
  Medal,
  CheckCircle2,
  RefreshCw,
  Clock,
  Check,
  X,
  ShieldAlert,
  Loader2,
} from "lucide-react";

export default function AdminLeaderboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Winner selections
  const [selectedFirst, setSelectedFirst] = useState<string>("");
  const [selectedSecond, setSelectedSecond] = useState<string>("");

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/leaderboard");
      const resData = await res.json();
      if (resData.success) {
        setData(resData);
        if (resData.quiz?.firstPrizeParticipantId) {
          setSelectedFirst(resData.quiz.firstPrizeParticipantId);
        } else if (resData.candidates?.firstPrize) {
          setSelectedFirst(resData.candidates.firstPrize.id);
        }

        if (resData.quiz?.secondPrizeParticipantId) {
          setSelectedSecond(resData.quiz.secondPrizeParticipantId);
        } else if (resData.candidates?.secondPrize) {
          setSelectedSecond(resData.candidates.secondPrize.id);
        }
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 3000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  const handleConfirmWinners = async () => {
    if (!selectedFirst || !selectedSecond) {
      alert("Please designate candidates for both First and Second prizes.");
      return;
    }
    if (selectedFirst === selectedSecond) {
      alert("First Prize and Second Prize winners must be different participants.");
      return;
    }

    if (!confirm("Confirm and permanently mark the selected First and Second Prize winners?")) {
      return;
    }

    setConfirming(true);
    try {
      const res = await fetch("/api/admin/quiz/confirm-winner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstPrizeId: selectedFirst,
          secondPrizeId: selectedSecond,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setMessage("Winners successfully ratified and confirmed!");
        fetchLeaderboard();
      } else {
        alert(resData.error || "Failed to confirm winners.");
      }
    } finally {
      setConfirming(false);
    }
  };

  const leaderboard = data?.leaderboard || [];
  const candidates = data?.candidates || {};
  const confirmed = data?.confirmedWinners || {};

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                PRAGYAN 2026 • Standings
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">ASIET Computer Applications</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Official Leaderboard & Prize Ratification
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live server-side computed rankings with tie-breaking: High Score &rarr; More Correct &rarr; Faster Answering Time
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="/display"
              target="_blank"
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-sm hover:bg-slate-800 transition-colors"
            >
              Auditorium Display Mode &rarr;
            </a>
            <button
              onClick={() => fetchLeaderboard()}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{message}</span>
          </div>
        )}

        {/* Prize Confirmation Pods (Section 28 & 59) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Prize Pod */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-3xl border border-amber-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
                <span className="text-2xl">🥇</span>
                <span>FIRST PRIZE (Champion)</span>
              </div>
              {confirmed.firstPrize && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black tracking-wider uppercase">
                  Officially Ratified
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                Select 1st Prize Winner:
              </label>
              <select
                value={selectedFirst}
                onChange={(e) => setSelectedFirst(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-amber-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Choose Winner --</option>
                {leaderboard.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    #{p.rank || "?"} {p.name} ({p.score} pts, {(p.totalTimeMs / 1000).toFixed(1)}s) - {p.status}
                  </option>
                ))}
              </select>
            </div>

            {selectedFirst && (
              <div className="bg-white/80 rounded-2xl p-3 border border-amber-200/80 text-xs">
                {(() => {
                  const p = leaderboard.find((x: any) => x.id === selectedFirst);
                  if (!p) return null;
                  return (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{p.uniqueCode}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-amber-700 text-sm">{p.score} pts</div>
                        <div className="text-[10px] text-slate-500">{(p.totalTimeMs / 1000).toFixed(1)}s</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Second Prize Pod */}
          <div className="bg-gradient-to-br from-slate-100 to-slate-200/50 rounded-3xl border border-slate-300 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
                <span className="text-2xl">🥈</span>
                <span>SECOND PRIZE (Runner-Up)</span>
              </div>
              {confirmed.secondPrize && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-300 text-slate-900 text-[10px] font-black tracking-wider uppercase">
                  Officially Ratified
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Select 2nd Prize Winner:
              </label>
              <select
                value={selectedSecond}
                onChange={(e) => setSelectedSecond(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-500"
              >
                <option value="">-- Choose Winner --</option>
                {leaderboard.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    #{p.rank || "?"} {p.name} ({p.score} pts, {(p.totalTimeMs / 1000).toFixed(1)}s) - {p.status}
                  </option>
                ))}
              </select>
            </div>

            {selectedSecond && (
              <div className="bg-white/80 rounded-2xl p-3 border border-slate-200 text-xs">
                {(() => {
                  const p = leaderboard.find((x: any) => x.id === selectedSecond);
                  if (!p) return null;
                  return (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{p.uniqueCode}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-slate-700 text-sm">{p.score} pts</div>
                        <div className="text-[10px] text-slate-500">{(p.totalTimeMs / 1000).toFixed(1)}s</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Ratification Button */}
        <div className="flex justify-end">
          <button
            onClick={handleConfirmWinners}
            disabled={confirming || !selectedFirst || !selectedSecond}
            className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 active:scale-[0.98] transition-all flex items-center space-x-2 disabled:bg-slate-300"
          >
            {confirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Confirming Standings...</span>
              </>
            ) : (
              <>
                <Award className="w-4 h-4" />
                <span>CONFIRM 1ST & 2ND PRIZE WINNERS</span>
              </>
            )}
          </button>
        </div>

        {/* Live Leaderboard Table (Section 27) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Rankings Matrix
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Participant Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Correct</th>
                  <th className="py-3 px-4">Incorrect</th>
                  <th className="py-3 px-4">Total Time</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No participants registered yet.
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((p: any, idx: number) => {
                    const isFirst = p.id === confirmed.firstPrize?.id || (p.rank === 1 && !confirmed.firstPrize);
                    const isSecond = p.id === confirmed.secondPrize?.id || (p.rank === 2 && !confirmed.secondPrize);

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          isFirst
                            ? "bg-amber-50/40"
                            : isSecond
                            ? "bg-slate-50/70"
                            : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          {isFirst ? (
                            <span className="inline-flex items-center text-amber-700 font-black">
                              <span className="mr-1">🥇</span> #1
                            </span>
                          ) : isSecond ? (
                            <span className="inline-flex items-center text-slate-700 font-black">
                              <span className="mr-1">🥈</span> #2
                            </span>
                          ) : (
                            <span className="font-mono font-bold text-slate-500">
                              {p.rank ? `#${p.rank}` : "—"}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          {p.failReason && (
                            <span className="text-[10px] text-rose-600 block truncate max-w-xs">
                              {p.failReason}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                          {p.uniqueCode}
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-slate-900 text-sm">
                          {p.score.toFixed(1)}
                        </td>
                        <td className="py-3 px-4 text-emerald-600 font-bold">
                          {p.correctCount}
                        </td>
                        <td className="py-3 px-4 text-rose-600 font-bold">
                          {p.wrongCount}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {(p.totalTimeMs / 1000).toFixed(1)}s
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === "COMPLETED"
                                ? "bg-sky-50 text-sky-700 border border-sky-200"
                                : p.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : p.status === "FAILED" || p.status === "TERMINATED"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {p.status}
                          </span>
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
