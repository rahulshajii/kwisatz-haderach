"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, ArrowRight, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();
    setCode(val);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setError("Please enter your unique quiz code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/participant/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid or expired code.");
        setLoading(false);
        return;
      }

      // Store verified participant in session storage for confirm page
      sessionStorage.setItem("kh_temp_participant", JSON.stringify(data.participant));
      sessionStorage.setItem("kh_temp_quiz", JSON.stringify(data.quiz));
      sessionStorage.setItem("kh_code", cleanCode);

      router.push(`/confirm?code=${encodeURIComponent(cleanCode)}`);
    } catch {
      setError("Network error. Please check your internet connection.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-between p-4">
      {/* Top Bar */}
      <div className="max-w-md mx-auto w-full pt-4">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>
      </div>

      {/* Login Card */}
      <div className="max-w-md mx-auto w-full my-auto py-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Unique Code Access
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            KWISATZ HADERACH — PRAGYAN 2026
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="code"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Participant Code
              </label>
              <div className="relative">
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="e.g. KH26-A7F92"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full px-4 py-3.5 text-center font-mono text-lg font-bold tracking-widest uppercase rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 placeholder:font-sans placeholder:text-sm placeholder:tracking-normal transition-all"
                  maxLength={15}
                  disabled={loading}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 text-center">
                Enter the exact 10-character code provided to you
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-sky-600/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>VERIFY IDENTITY</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 block">
              Department of Computer Applications • ASIET
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full text-center pb-4 text-[11px] text-slate-400">
        Pragyan 2026 Live Competition Engine
      </div>
    </main>
  );
}
