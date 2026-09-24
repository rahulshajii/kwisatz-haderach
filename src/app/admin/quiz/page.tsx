"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import {
  Play,
  Pause,
  StopCircle,
  RotateCcw,
  Sliders,
  Shield,
  Clock,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export default function AdminQuizControlPage() {
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("KWISATZ HADERACH");
  const [eventName, setEventName] = useState("PRAGYAN 2026");
  const [college, setCollege] = useState("ASIET");
  const [department, setDepartment] = useState("Department of Computer Applications");
  const [duration, setDuration] = useState(1800);
  const [antiCheatMode, setAntiCheatMode] = useState<"STRICT" | "WARNING">("STRICT");
  const [warningThreshold, setWarningThreshold] = useState(2);
  const [tieBreakRule, setTieBreakRule] = useState("SCORE_CORRECT_TIME");
  const [allowReconnect, setAllowReconnect] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/quiz/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        const s = data.settings;
        setQuiz(s);
        setName(s.name);
        setEventName(s.eventName);
        setCollege(s.college);
        setDepartment(s.department);
        setDuration(s.duration);
        setAntiCheatMode(s.antiCheatMode);
        setWarningThreshold(s.warningThreshold);
        setTieBreakRule(s.tieBreakRule);
        setAllowReconnect(s.allowReconnect);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAction = async (action: string, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/admin/quiz/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, confirm: true }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        fetchSettings();
      } else {
        alert(data.error || "Action failed.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/quiz/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          eventName,
          college,
          department,
          duration: Number(duration),
          antiCheatMode,
          warningThreshold: Number(warningThreshold),
          tieBreakRule,
          allowReconnect,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage("Quiz configuration saved successfully.");
        setQuiz(data.settings);
      } else {
        alert(data.error || "Failed to save settings.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <AdminNav />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quiz Master Control & Settings
          </h1>
          <p className="text-xs text-slate-500">
            Control tournament state and adjust anti-cheat policies, timers, and tie-breaking rules
          </p>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{message}</span>
          </div>
        )}

        {/* Global Control Panel (Section 31) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tournament Execution State
              </h2>
              <p className="text-xs text-slate-500">
                State transitions synchronize instantaneously with all participant screens
              </p>
            </div>
            <div className="px-3 py-1 rounded-xl bg-slate-900 text-white font-mono text-xs font-bold">
              CURRENT: {quiz?.status || "WAITING"}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <button
              onClick={() => handleAction("START_QUIZ", "Start quiz now for all participants?")}
              disabled={quiz?.status === "RUNNING"}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START QUIZ</span>
            </button>

            <button
              onClick={() => handleAction("PAUSE_QUIZ")}
              disabled={quiz?.status !== "RUNNING"}
              className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs transition-all flex items-center justify-center space-x-2"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>PAUSE QUIZ</span>
            </button>

            <button
              onClick={() => handleAction("RESUME_QUIZ")}
              disabled={quiz?.status !== "PAUSED"}
              className="py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs transition-all flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>RESUME QUIZ</span>
            </button>

            <button
              onClick={() => handleAction("END_QUIZ", "Permanently end the active round and calculate final ranks?")}
              disabled={quiz?.status !== "RUNNING" && quiz?.status !== "PAUSED"}
              className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs transition-all flex items-center justify-center space-x-2"
            >
              <StopCircle className="w-4 h-4" />
              <span>END ROUND</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Reset removes all scores, activity logs, and resets participants to registered.
            </span>
            <button
              onClick={() => handleAction("RESET_QUIZ", "DANGER: This will purge all answers and reset scores to 0. Type OK to confirm.")}
              className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET QUIZ (DANGER)</span>
            </button>
          </div>
        </div>

        {/* Quiz Configuration Form (Section 50) */}
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-900">
              Rules & Policy Configuration
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quiz Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Quiz Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Event Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Event Name
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* College */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                College / Institution
              </label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Anti-Cheat Policy (Section 15) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 md:col-span-2 space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <Shield className="w-4 h-4 text-sky-600" />
                <span>Anti-Cheating Policy Mode</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    antiCheatMode === "STRICT"
                      ? "bg-rose-50 border-rose-300 ring-2 ring-rose-500"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="antiCheat"
                    checked={antiCheatMode === "STRICT"}
                    onChange={() => setAntiCheatMode("STRICT")}
                    className="sr-only"
                  />
                  <div className="font-bold text-xs text-rose-900">STRICT MODE (Zero Tolerance)</div>
                  <div className="text-[11px] text-slate-600 mt-1 leading-snug">
                    Any confirmed page exit, tab switch, or browser minimization immediately terminates the participant as FAILED.
                  </div>
                </label>

                <label
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    antiCheatMode === "WARNING"
                      ? "bg-amber-50 border-amber-300 ring-2 ring-amber-500"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="antiCheat"
                    checked={antiCheatMode === "WARNING"}
                    onChange={() => setAntiCheatMode("WARNING")}
                    className="sr-only"
                  />
                  <div className="font-bold text-xs text-amber-900">WARNING MODE (Grace Period)</div>
                  <div className="text-[11px] text-slate-600 mt-1 leading-snug">
                    Issues on-screen warning popups on first 2 violations. Terminates as FAILED upon exceeding the threshold.
                  </div>
                </label>
              </div>

              {antiCheatMode === "WARNING" && (
                <div className="flex items-center space-x-3 pt-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Warning Threshold:
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={warningThreshold}
                    onChange={(e) => setWarningThreshold(Number(e.target.value))}
                    className="w-20 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                  <span className="text-[11px] text-slate-500">
                    warnings before termination
                  </span>
                </div>
              )}
            </div>

            {/* Tie-breaking rule (Section 29) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tie-Breaking Rule
              </label>
              <select
                value={tieBreakRule}
                onChange={(e) => setTieBreakRule(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
              >
                <option value="SCORE_CORRECT_TIME">
                  1. High Score &rarr; 2. More Correct &rarr; 3. Faster Answering Time
                </option>
                <option value="SCORE_TIME">
                  1. High Score &rarr; 2. Faster Total Time
                </option>
              </select>
            </div>

            {/* Allow Reconnect */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reconnection Policy
              </label>
              <label className="flex items-center space-x-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowReconnect}
                  onChange={(e) => setAllowReconnect(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Allow participant to reconnect after accidental disconnection/refresh
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>SAVE CONFIGURATION</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
