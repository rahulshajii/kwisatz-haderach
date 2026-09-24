import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Award, Sparkles, Terminal } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Banner / Navbar */}
      <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-black text-sm tracking-wider shadow-sm">
              KH
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight block text-sm leading-none">
                KWISATZ HADERACH
              </span>
              <span className="text-[10px] text-sky-600 font-semibold tracking-wider uppercase">
                PRAGYAN 2026
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-slate-500 block leading-tight">
              ASIET
            </span>
            <span className="text-[10px] text-slate-400">
              MCA Dept
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto w-full text-center">
        {/* Futuristic Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
          <span>Official Technical Competition</span>
        </div>

        {/* Institution Info */}
        <div className="mb-2">
          <h2 className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-widest">
            Adi Shankara Institute of Engineering & Technology
          </h2>
          <p className="text-xs text-sky-700 font-medium">
            Department of Computer Applications
          </p>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 mt-1 mb-2">
          KWISATZ HADERACH
        </h1>
        <div className="inline-block px-3 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-semibold tracking-widest uppercase mb-6 shadow-sm">
          PRAGYAN 2026
        </div>

        {/* Intro Card */}
        <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card text-left space-y-4 mb-6">
          <div className="flex items-center space-x-3 text-slate-900 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-sky-100/70 text-sky-700">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Live Technical Arena</h3>
              <p className="text-xs text-slate-500">Real-time competitive aptitude & computer science quiz</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <Zap className="w-4 h-4 mx-auto text-amber-500 mb-1" />
              <div className="text-[11px] font-semibold text-slate-800">Timed</div>
              <div className="text-[10px] text-slate-500">Server-synced</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <ShieldCheck className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
              <div className="text-[11px] font-semibold text-slate-800">Monitored</div>
              <div className="text-[10px] text-slate-500">Anti-cheat active</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <Award className="w-4 h-4 mx-auto text-sky-500 mb-1" />
              <div className="text-[11px] font-semibold text-slate-800">Awards</div>
              <div className="text-[10px] text-slate-500">1st & 2nd Prize</div>
            </div>
          </div>

          <p className="text-xs text-slate-600 bg-sky-50/50 p-3 rounded-xl border border-sky-100/60 leading-relaxed text-center">
            Enter the unique quiz code provided by the coordinators to verify your identity and start.
          </p>
        </div>

        {/* Enter Quiz Button */}
        <Link
          href="/login"
          className="w-full group relative inline-flex items-center justify-center px-6 py-4 rounded-xl bg-sky-600 text-white font-bold text-base shadow-lg shadow-sky-600/25 hover:bg-sky-500 active:scale-[0.98] transition-all duration-150"
        >
          <span>ENTER QUIZ</span>
          <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
        </Link>

        {/* Admin Link shortcut */}
        <div className="mt-6 text-center">
          <Link
            href="/admin/login"
            className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            Coordinator / Admin Login &rarr;
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-4 border-t border-slate-200 text-center text-xs text-slate-400">
        <p>© 2026 ASIET — Department of Computer Applications. All Rights Reserved.</p>
      </footer>
    </main>
  );
}
