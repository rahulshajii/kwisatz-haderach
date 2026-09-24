"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PlayCircle,
  HelpCircle,
  Users,
  Trophy,
  Activity,
  Settings,
  Projector,
  LogOut,
} from "lucide-react";

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Quiz Control", href: "/admin/quiz", icon: PlayCircle },
    { label: "Participants", href: "/admin/participants", icon: Users },
    { label: "Questions", href: "/admin/questions", icon: HelpCircle },
    { label: "Leaderboard", href: "/admin/leaderboard", icon: Trophy },
    { label: "Live Activity", href: "/admin/activity", icon: Activity },
    { label: "Settings", href: "/admin/settings", icon: Settings },
    { label: "Projector Mode", href: "/display", icon: Projector, target: "_blank" },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    } catch {
      router.push("/admin/login");
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-black text-sm tracking-wider shadow">
              KH
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight block leading-tight">
                KWISATZ HADERACH
              </span>
              <span className="text-[10px] text-sky-400 font-semibold tracking-wider uppercase">
                PRAGYAN 2026 • Admin Portal
              </span>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Tab Links */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                target={item.target}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
