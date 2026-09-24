"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Wifi,
  Smartphone,
  ShieldAlert,
  Loader2,
  ArrowRight,
} from "lucide-react";

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code") || "";

  const [participant, setParticipant] = useState<{
    id: string;
    name: string;
    uniqueCode: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Device checks
  const [deviceChecks, setDeviceChecks] = useState({
    jsEnabled: true,
    visibilitySupported: false,
    storageAvailable: false,
    fullscreenSupported: false,
    online: true,
    screenSize: "",
  });

  useEffect(() => {
    // 1. Load participant details
    const stored = sessionStorage.getItem("kh_temp_participant");
    if (stored) {
      try {
        setParticipant(JSON.parse(stored));
      } catch {}
    } else if (codeParam) {
      fetch("/api/participant/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeParam }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setParticipant(data.participant);
          } else {
            router.push("/login");
          }
        })
        .catch(() => router.push("/login"));
    } else {
      router.push("/login");
    }

    // 2. Perform lightweight pre-quiz compatibility check (Section 9)
    const hasVisibility = typeof document !== "undefined" && "visibilityState" in document;
    let hasStorage = false;
    try {
      localStorage.setItem("__test", "1");
      localStorage.removeItem("__test");
      hasStorage = true;
    } catch {
      hasStorage = false;
    }

    const hasFullscreen =
      typeof document !== "undefined" &&
      (document.fullscreenEnabled ||
        (document as any).webkitFullscreenEnabled ||
        (document as any).mozFullScreenEnabled ||
        false);

    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    const screenDims = `${window.innerWidth}x${window.innerHeight}`;

    setDeviceChecks({
      jsEnabled: true,
      visibilitySupported: Boolean(hasVisibility),
      storageAvailable: hasStorage,
      fullscreenSupported: Boolean(hasFullscreen),
      online: isOnline,
      screenSize: screenDims,
    });
  }, [codeParam, router]);

  const handleContinue = async () => {
    if (!participant) return;

    setLoading(true);
    setError(null);

    try {
      if (document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen();
        } catch {}
      }

      const res = await fetch("/api/participant/start-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: participant.uniqueCode,
          deviceInfo: {
            screen: deviceChecks.screenSize,
            userAgent: navigator.userAgent,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to start quiz session.");
        setLoading(false);
        return;
      }

      if (data.quiz && data.quiz.status === "RUNNING") {
        router.push("/quiz");
      } else {
        router.push("/waiting");
      }
    } catch {
      setError("Network connection issue. Please try again.");
      setLoading(false);
    }
  };

  if (!participant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  const firstName = participant.name.split(" ")[0] || participant.name;

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 py-8">
      <div className="max-w-md mx-auto w-full my-auto space-y-4">
        {/* Welcome Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 mb-2">
            <UserCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome, {firstName}!
          </h1>
          <p className="text-xs text-slate-500">
            PRAGYAN 2026 — KWISATZ HADERACH
          </p>
        </div>

        {/* Identity Confirmation Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Registered Participant
          </div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="text-lg font-bold text-slate-900 leading-tight">
                {participant.name}
              </div>
              <div className="text-xs text-sky-600 font-medium">ASIET Student Participant</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-mono">CODE</span>
              <span className="font-mono text-sm font-bold bg-slate-100 px-2 py-1 rounded text-slate-800">
                {participant.uniqueCode}
              </span>
            </div>
          </div>

          {/* Device Compatibility Summary */}
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Device Compatibility Check</span>
              <span className="text-emerald-600 text-[10px] font-semibold flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-0.5" /> Ready
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center space-x-2">
                <Smartphone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="text-[11px] text-slate-600 truncate">{deviceChecks.screenSize} Screen</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center space-x-2">
                <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] text-slate-600 truncate">
                  {deviceChecks.online ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Anti-Cheating Advisory */}
        <div className="bg-rose-50/70 border border-rose-200/90 rounded-2xl p-5 text-left space-y-3">
          <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>IMPORTANT ANTI-CHEATING RULES</span>
          </div>

          <ul className="text-xs text-rose-950 space-y-1.5 pl-1 leading-relaxed">
            <li className="flex items-start">
              <span className="text-rose-500 font-bold mr-2">•</span>
              <span><strong>Do not leave this page</strong> or minimize your browser.</span>
            </li>
            <li className="flex items-start">
              <span className="text-rose-500 font-bold mr-2">•</span>
              <span><strong>Do not switch applications</strong> or open other tabs.</span>
            </li>
            <li className="flex items-start">
              <span className="text-rose-500 font-bold mr-2">•</span>
              <span><strong>Do not use external assistance</strong> or secondary devices.</span>
            </li>
            <li className="flex items-start">
              <span className="text-rose-500 font-bold mr-2">•</span>
              <span>Your browser focus and page state are <strong>actively monitored</strong>. Violation will terminate your quiz with <strong>FAILED</strong> status.</span>
            </li>
          </ul>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={loading}
          className="w-full py-4 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white font-bold text-base shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center space-x-2 disabled:bg-slate-300"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Initializing Quiz Session...</span>
            </>
          ) : (
            <>
              <span>I UNDERSTAND — CONTINUE</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-400 text-center">
          Department of Computer Applications • ASIET
        </p>
      </div>
    </main>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
