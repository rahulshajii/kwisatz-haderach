"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import {
  Activity,
  ShieldAlert,
  Search,
  RefreshCw,
  Clock,
  Filter,
  Eye,
  Loader2,
} from "lucide-react";

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("");
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    try {
      let url = "/api/admin/activity?limit=100";
      if (filterType) url += `&eventType=${encodeURIComponent(filterType)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    const matchName = log.participant?.name?.toLowerCase().includes(search.toLowerCase());
    const matchCode = log.participant?.uniqueCode?.toLowerCase().includes(search.toLowerCase());
    const matchType = log.eventType?.toLowerCase().includes(search.toLowerCase());
    return matchName || matchCode || matchType;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Live Activity & Anti-Cheat Audit Trail
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time audit log of window blurs, tab switches, lifecycle events, and answer submissions
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchLogs()}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search participant name, code, or event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-64 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Event Types</option>
            <option value="PAGE_HIDDEN">PAGE_HIDDEN (Tab Switch)</option>
            <option value="WINDOW_BLUR">WINDOW_BLUR (App Lost Focus)</option>
            <option value="WINDOW_FOCUS">WINDOW_FOCUS (Returned)</option>
            <option value="FULLSCREEN_EXIT">FULLSCREEN_EXIT</option>
            <option value="BACK_NAVIGATION">BACK_NAVIGATION</option>
            <option value="ANSWER_SUBMITTED">ANSWER_SUBMITTED</option>
            <option value="SESSION_ESTABLISHED">SESSION_ESTABLISHED</option>
            <option value="ADMIN_TERMINATED">ADMIN_TERMINATED</option>
          </select>
        </div>

        {/* Logs Feed */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Details / Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No activity logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isViolation = [
                      "PAGE_HIDDEN",
                      "TAB_SWITCH",
                      "WINDOW_BLUR",
                      "FULLSCREEN_EXIT",
                      "BACK_NAVIGATION",
                      "ADMIN_TERMINATED",
                    ].includes(log.eventType);

                    return (
                      <tr
                        key={log.id}
                        className={`hover:bg-slate-50/60 transition-colors ${
                          isViolation ? "bg-rose-50/30" : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {log.participant?.name || "System"}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                          {log.participant?.uniqueCode || "—"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isViolation
                                ? "bg-rose-100 text-rose-700 border border-rose-200"
                                : log.eventType === "ANSWER_SUBMITTED"
                                ? "bg-sky-50 text-sky-700 border border-sky-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {log.eventType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                          {log.metadata || "—"}
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
