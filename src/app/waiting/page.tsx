"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Clock, Wifi, WifiOff, ShieldCheck, Sparkles, Terminal } from "lucide-react";

export default function WaitingPage() {
  const router = useRouter();
  const [participant, setParticipant] = useState<{
    id: string;
    name: string;
    uniqueCode: string;
  } | null>(null);

  const [connected, setConnected] = useState(true);
  const [quizStatus, setQuizStatus] = useState("WAITING");
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // 1. Load participant details from session storage
    const stored = sessionStorage.getItem("kh_temp_participant");
    if (stored) {
      try {
        setParticipant(JSON.parse(stored));
      } catch {}
    }

    // 2. Setup Real-time SSE listener
    try {
      const es = new EventSource("/api/events");
      eventSourceRef.current = es;

      es.addEventListener("quiz_status", (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          setQuizStatus(data.status);
          if (data.status === "RUNNING") {
            router.push("/quiz");
          }
        } catch {}
      });

      es.onopen = () => setConnected(true);
      es.onerror = () => {
        setConnected(false);
        // Fallback polling will handle status
      };
    } catch {
      setConnected(false);
    }

    // 3. Fallback polling every 2 seconds to check quiz status and maintain heartbeat
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/participant/status");
        if (res.status === 401 || res.status === 403) {
          router.push("/login");
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setConnected(true);
          setQuizStatus(data.quizStatus);

          if (data.participantStatus === "FAILED" || data.participantStatus === "TERMINATED") {
            router.push("/failed");
            return;
          }

          if (data.quizStatus === "RUNNING" || data.participantStatus === "ACTIVE") {
            router.push("/quiz");
          }
        } else {
          setConnected(false);
        }
      } catch {
        setConnected(false);
      }
    }, 2000);

    return () => {
      clearInterval(pollInterval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-between p-4">
      {/* Top Navbar */}
      <div className="max-w-md mx-auto w-full pt-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-xs">
            KH
          </div>
          <div>
            <span className="font-bold text-xs text-slate-800 block leading-tight">KWISATZ HADERACH</span>
            <span className="text-[10px] text-sky-600 font-semibold uppercase">PRAGYAN 2026</span>
          </div>
        </div>

        {/* Connection status pill (Section 41) */}
        <div
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
            connected
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
          }`}
        >
          {connected ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              <span>Connected</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
              <span>Reconnecting...</span>
            </>
          )}
        </div>
      </div>

      {/* Center Waiting Hero */}
      <div className="max-w-md mx-auto w-full my-auto text-center space-y-6 py-8">
        {/* Pulsing Radar Visual */}
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-sky-400/20 animate-ping duration-1000" />
          <div className="absolute inset-2 rounded-full bg-sky-400/30 animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-white border border-sky-200 shadow-glow flex items-center justify-center text-sky-600">
            <Clock className="w-8 h-8 animate-spin duration-3000" />
          </div>
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-sky-100/70 text-sky-700 text-xs font-bold uppercase tracking-wider mb-2">
            Status: {quizStatus}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            WAITING FOR QUIZ TO START
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
            Please wait for the administrator to start the quiz. Your screen will automatically launch when the round begins.
          </p>
        </div>

        {/* Participant Identity Badge */}
        {participant && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle text-left max-w-xs mx-auto">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Participant Verified
            </div>
            <div className="text-sm font-bold text-slate-800 truncate">
              {participant.name}
            </div>
            <div className="text-xs font-mono text-sky-600 font-semibold mt-0.5">
              Code: {participant.uniqueCode}
            </div>
          </div>
        )}

        {/* Reminder Pill */}
        <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200/60 text-slate-600 text-xs flex items-center justify-center space-x-2 max-w-xs mx-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Keep this tab open and your screen on.</span>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="max-w-md mx-auto w-full text-center pb-2 text-[11px] text-slate-400">
        Adi Shankara Institute of Engineering & Technology • MCA Dept
      </div>
    </main>
  );
}
