"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Award, Clock, ArrowRight, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

export default function ResultPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/participant/result")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData);
          // Launch celebration confetti
          try {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
            });
          } catch {}
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  const p = data?.participant;
  const quiz = data?.quiz;

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 py-8">
      <div className="max-w-md mx-auto w-full my-auto space-y-5 text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-[11px] font-bold text-sky-600 uppercase tracking-widest block mb-1">
            PRAGYAN 2026 • ASIET
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            QUIZ COMPLETED
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thank you for participating in {quiz?.name || "KWISATZ HADERACH"}!
          </p>
        </div>

        {/* Scorecard */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card text-left space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Participant
              </div>
              <div className="text-lg font-bold text-slate-900 leading-tight">
                {p?.name || "Participant"}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                {p?.uniqueCode}
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {p?.status || "COMPLETED"}
              </span>
            </div>
          </div>

          {/* Big Score Display */}
          <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Your Total Score
            </div>
            <div className="text-4xl font-black text-sky-600 mt-1">
              {p?.score !== undefined ? p.score.toFixed(1) : "0.0"}
            </div>
            {p?.rank && (
              <div className="text-xs font-semibold text-slate-600 mt-1">
                Current Rank: <span className="text-sky-600 font-bold">#{p.rank}</span>
              </div>
            )}
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-lg font-bold text-emerald-600">
                {p?.correctCount || 0}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">
                Correct
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-lg font-bold text-rose-600">
                {p?.wrongCount || 0}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">
                Wrong
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-lg font-bold text-slate-700">
                {p?.totalTimeMs ? (p.totalTimeMs / 1000).toFixed(1) : 0}s
              </div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">
                Time
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center pt-2">
            Final official prizes and standings will be published by the event coordinators upon completion of all participants.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
        >
          Return to Event Home <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="max-w-md mx-auto w-full text-center text-[11px] text-slate-400 pb-2">
        Department of Computer Applications • ASIET
      </div>
    </main>
  );
}
