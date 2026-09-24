"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldX, AlertOctagon, ArrowLeft } from "lucide-react";

export default function FailedPage() {
  const [participant, setParticipant] = useState<any>(null);

  useEffect(() => {
    fetch("/api/participant/result")
      .then((res) => res.json())
      .then((data) => {
        if (data.participant) setParticipant(data.participant);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-rose-50/50 flex flex-col justify-between p-4 py-8">
      <div className="max-w-md mx-auto w-full my-auto text-center space-y-6">
        {/* Terminated Icon */}
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-md">
          <ShieldX className="w-10 h-10" />
        </div>

        <div>
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-widest block mb-1">
            ANTI-CHEATING SYSTEM VIOLATION
          </span>
          <h1 className="text-3xl font-black text-rose-950 tracking-tight">
            QUIZ TERMINATED
          </h1>
          <p className="text-xs text-rose-800/80 mt-1 max-w-xs mx-auto">
            Your quiz session has been terminated because a prohibited navigation or browser activity was detected.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-rose-200 p-6 shadow-card text-left space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Participant Status
              </div>
              <div className="text-base font-bold text-slate-900">
                {participant?.name || "Participant"}
              </div>
            </div>
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-sm">
                FAILED
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-rose-50/80 rounded-2xl border border-rose-100 text-xs text-rose-900 space-y-1">
            <div className="font-bold flex items-center">
              <AlertOctagon className="w-4 h-4 mr-1 text-rose-600 shrink-0" />
              <span>Termination Logged:</span>
            </div>
            <p className="text-[11px] text-rose-800 leading-relaxed pl-5">
              {participant?.failReason || "Prohibited page exit / tab switch detected during active quiz."}
            </p>
          </div>

          <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <p>
              • Your responses prior to termination have been securely recorded on the server.
            </p>
            <p>
              • In accordance with tournament rules, correct answers are not revealed, and access codes cannot be reused.
            </p>
            <p>
              • If you believe this occurred due to a verifiable technical disruption, please report directly to the ASIET stage coordinators.
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Return to Event Homepage
        </Link>
      </div>

      <div className="max-w-md mx-auto w-full text-center text-[11px] text-slate-400 pb-2">
        KWISATZ HADERACH — PRAGYAN 2026 • Department of Computer Applications
      </div>
    </main>
  );
}
