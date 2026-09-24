"use client";

import { useEffect, useState, useCallback } from "react";
import { Trophy, Award, Users, Play, Clock, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export default function AuditoriumDisplayPage() {
  const [data, setData] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [hasLaunchedConfetti, setHasLaunchedConfetti] = useState(false);

  const fetchDisplayData = useCallback(async () => {
    try {
      const [dashRes, leadRes] = await Promise.all([
        fetch("/api/admin/dashboard"),
        fetch("/api/admin/leaderboard"),
      ]);

      const dashData = await dashRes.json();
      const leadData = await leadRes.json();

      if (dashData.success) setData(dashData);
      if (leadData.success) {
        setParticipants(leadData.leaderboard || []);

        // If quiz is FINISHED and winners are confirmed, fire auditorium confetti
        if (
          dashData.quiz?.status === "FINISHED" &&
          leadData.confirmedWinners?.firstPrize &&
          !hasLaunchedConfetti
        ) {
          try {
            confetti({
              particleCount: 150,
              spread: 100,
              origin: { y: 0.5 },
            });
            setHasLaunchedConfetti(true);
          } catch {}
        }
      }
    } catch {}
  }, [hasLaunchedConfetti]);

  useEffect(() => {
    fetchDisplayData();
    const interval = setInterval(fetchDisplayData, 2000);
    return () => clearInterval(interval);
  }, [fetchDisplayData]);

  const quiz = data?.quiz;
  const stats = data?.stats;
  const firstPrize = participants.find((p) => p.id === quiz?.firstPrizeParticipantId) || participants[0];
  const secondPrize = participants.find((p) => p.id === quiz?.secondPrizeParticipantId) || participants[1];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 sm:p-12 select-none overflow-hidden">
      {/* Top Banner */}
      <header className="flex items-center justify-between border-b border-slate-800/80 pb-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-500 flex items-center justify-center font-black text-2xl text-slate-950 shadow-glow">
            KH
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-sky-400 tracking-widest uppercase">
                PRAGYAN 2026
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-semibold">
                Adi Shankara Institute of Engineering & Technology
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-1">
              KWISATZ HADERACH
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Department of Computer Applications • Live Technical Quiz Arena
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="text-right">
          <div className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-sm font-black font-mono shadow-md">
            <span
              className={`w-3 h-3 rounded-full ${
                quiz?.status === "RUNNING"
                  ? "bg-emerald-400 animate-ping"
                  : quiz?.status === "PAUSED"
                  ? "bg-amber-400"
                  : "bg-sky-400"
              }`}
            />
            <span className="text-slate-200">STATE: {quiz?.status || "WAITING"}</span>
          </div>
        </div>
      </header>

      {/* Main Center Area */}
      <div className="my-auto py-8">
        {quiz?.status === "FINISHED" && (
          <div className="text-center mb-8 animate-in fade-in zoom-in duration-500">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-sm font-bold uppercase tracking-widest mb-4">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Official Tournament Results</span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
              CHAMPIONS OF KWISATZ HADERACH
            </h2>

            {/* Winner Podiums */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-8">
              {/* First Prize */}
              <div className="bg-gradient-to-b from-amber-500/20 to-slate-900/90 border-2 border-amber-400/80 rounded-3xl p-8 text-center shadow-2xl relative">
                <div className="text-5xl mb-2">🥇</div>
                <div className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">
                  FIRST PRIZE WINNER
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white">
                  {firstPrize?.name || "Participant"}
                </div>
                <div className="text-sm font-mono text-amber-300 font-bold mt-1">
                  Code: {firstPrize?.uniqueCode || "—"}
                </div>
                <div className="mt-4 pt-4 border-t border-amber-500/30 flex items-center justify-center space-x-6">
                  <div>
                    <span className="text-xs text-slate-400 uppercase block font-semibold">Score</span>
                    <span className="text-2xl font-black text-amber-400">{firstPrize?.score || 0} pts</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase block font-semibold">Time</span>
                    <span className="text-2xl font-black text-slate-200">
                      {firstPrize?.totalTimeMs ? (firstPrize.totalTimeMs / 1000).toFixed(1) : 0}s
                    </span>
                  </div>
                </div>
              </div>

              {/* Second Prize */}
              <div className="bg-gradient-to-b from-slate-400/20 to-slate-900/90 border-2 border-slate-400/80 rounded-3xl p-8 text-center shadow-2xl relative">
                <div className="text-5xl mb-2">🥈</div>
                <div className="text-xs font-black text-slate-300 uppercase tracking-widest mb-1">
                  SECOND PRIZE WINNER
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white">
                  {secondPrize?.name || "Participant"}
                </div>
                <div className="text-sm font-mono text-slate-300 font-bold mt-1">
                  Code: {secondPrize?.uniqueCode || "—"}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-500/30 flex items-center justify-center space-x-6">
                  <div>
                    <span className="text-xs text-slate-400 uppercase block font-semibold">Score</span>
                    <span className="text-2xl font-black text-slate-200">{secondPrize?.score || 0} pts</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase block font-semibold">Time</span>
                    <span className="text-2xl font-black text-slate-200">
                      {secondPrize?.totalTimeMs ? (secondPrize.totalTimeMs / 1000).toFixed(1) : 0}s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-8">
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
              Registered Students
            </span>
            <span className="text-4xl sm:text-5xl font-black text-white mt-1 block">
              {stats?.totalParticipants || 0}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl text-center">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest block">
              Online / Joined
            </span>
            <span className="text-4xl sm:text-5xl font-black text-sky-400 mt-1 block">
              {stats?.joinedCount || 0}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl text-center">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">
              Actively Answering
            </span>
            <span className="text-4xl sm:text-5xl font-black text-emerald-400 mt-1 block">
              {stats?.activeCount || 0}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl text-center">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block">
              Completed
            </span>
            <span className="text-4xl sm:text-5xl font-black text-purple-400 mt-1 block">
              {stats?.completedCount || 0}
            </span>
          </div>
        </div>

        {/* Top 5 Leaderboard Preview */}
        {quiz?.status !== "FINISHED" && participants.length > 0 && (
          <div className="max-w-4xl mx-auto bg-slate-900/60 border border-slate-800/90 rounded-3xl p-6 backdrop-blur-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">
              Current Live Standings (Top 5)
            </h3>
            <div className="space-y-2">
              {participants.slice(0, 5).map((p: any, idx: number) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60 text-sm"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-xl bg-slate-900 font-mono font-black text-sky-400 flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-white text-base">{p.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-mono text-slate-400">
                      {(p.totalTimeMs / 1000).toFixed(1)}s
                    </span>
                    <span className="font-mono font-black text-emerald-400 text-lg">
                      {p.score.toFixed(1)} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
        <div>Department of Computer Applications • ASIET</div>
        <div>KWISATZ HADERACH — PRAGYAN 2026 Engine</div>
      </footer>
    </main>
  );
}
