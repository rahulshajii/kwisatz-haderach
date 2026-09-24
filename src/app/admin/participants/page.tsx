"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import {
  Users,
  Plus,
  KeyRound,
  Download,
  Lock,
  Unlock,
  Trash2,
  RefreshCw,
  Search,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Papa from "papaparse";

export default function AdminParticipantsPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [batchCount, setBatchCount] = useState(10);
  const [singleName, setSingleName] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [importNamesText, setImportNamesText] = useState("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchParticipants = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/participants");
      const data = await res.json();
      if (data.success) {
        setParticipants(data.participants || []);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParticipants();
    const interval = setInterval(fetchParticipants, 3000);
    return () => clearInterval(interval);
  }, [fetchParticipants]);

  const handleGenerateBatch = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_batch",
          count: batchCount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Generated ${data.count} new participant codes.`);
        setShowGenerateModal(false);
        fetchParticipants();
      } else {
        alert(data.error || "Failed to generate codes.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_single",
          singleName,
          customCode: customCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Participant "${singleName}" added with code ${data.participant.uniqueCode}.`);
        setSingleName("");
        setCustomCode("");
        fetchParticipants();
      } else {
        alert(data.error || "Failed to create participant.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleImportNames = async () => {
    const names = importNamesText
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);

    if (names.length === 0) {
      alert("Please paste participant names (one per line).");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import_names",
          names,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Successfully imported ${data.count} participants with unique codes.`);
        setImportNamesText("");
        setShowImportModal(false);
        fetchParticipants();
      } else {
        alert(data.error || "Import failed.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleTerminate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to terminate "${name}"? Status will be set to TERMINATED.`)) return;

    try {
      await fetch("/api/admin/participants/terminate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: id }),
      });
      fetchParticipants();
    } catch {
      alert("Failed to terminate.");
    }
  };

  const handleReconnect = async (id: string) => {
    try {
      await fetch("/api/admin/participants/reconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: id }),
      });
      setStatusMessage("Participant unlocked and allowed to reconnect.");
      fetchParticipants();
    } catch {
      alert("Failed to unlock.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this participant and their answers?")) return;
    try {
      await fetch(`/api/admin/participants?id=${id}`, { method: "DELETE" });
      fetchParticipants();
    } catch {
      alert("Failed to delete.");
    }
  };

  const handleExportCodesCSV = () => {
    const rows = participants.map((p) => ({
      Name: p.name,
      "Participant Code": p.uniqueCode,
      Status: p.status,
      Score: p.score,
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kwisatz_haderach_codes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const filtered = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.uniqueCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header & Controls */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Participant & Code Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Issue unique access codes, import registered student rosters, and monitor individual device status
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Generate Codes</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Names</span>
            </button>

            <button
              onClick={handleExportCodesCSV}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Codes CSV</span>
            </button>

            <a
              href="/api/admin/export"
              download
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Full Results CSV</span>
            </a>
          </div>
        </div>

        {statusMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{statusMessage}</span>
          </div>
        )}

        {/* Quick Add Single Participant */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
          <form onSubmit={handleCreateSingle} className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              placeholder="Participant Full Name (e.g. John Doe)"
              value={singleName}
              onChange={(e) => setSingleName(e.target.value)}
              className="flex-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
            />
            <input
              type="text"
              placeholder="Optional Custom Code (e.g. KH26-A7F92)"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              className="w-full sm:w-60 px-4 py-2.5 rounded-xl border border-slate-200 font-mono text-xs uppercase font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="submit"
              disabled={actionLoading || !singleName.trim()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs whitespace-nowrap shadow-sm disabled:bg-slate-300"
            >
              Add Participant
            </button>
          </form>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div className="text-xs font-semibold text-slate-500">
            Total: {participants.length} registered
          </div>
        </div>

        {/* Participant Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Participant Name</th>
                  <th className="py-3 px-4">Unique Code</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Anti-Cheat</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No participants found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    let badge = "bg-slate-100 text-slate-700";
                    if (p.status === "ACTIVE") badge = "bg-emerald-50 text-emerald-700 border border-emerald-200";
                    if (p.status === "COMPLETED") badge = "bg-sky-50 text-sky-700 border border-sky-200";
                    if (p.status === "FAILED" || p.status === "TERMINATED") badge = "bg-rose-50 text-rose-700 border border-rose-200";
                    if (p.status === "DISCONNECTED") badge = "bg-amber-50 text-amber-700 border border-amber-200";

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          {p.failReason && (
                            <span className="text-[10px] text-rose-600 block truncate max-w-xs">
                              {p.failReason}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                            {p.uniqueCode}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {p.score.toFixed(1)}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {p.answeredCount} answered
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {(p.totalTimeMs / 1000).toFixed(1)}s
                        </td>
                        <td className="py-3 px-4">
                          {p.warningCount > 0 ? (
                            <span className="text-rose-600 font-bold">{p.warningCount} warn</span>
                          ) : (
                            <span className="text-emerald-600 font-semibold">Clean</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          {p.status === "FAILED" || p.status === "TERMINATED" ? (
                            <button
                              onClick={() => handleReconnect(p.id)}
                              className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px] border border-amber-200"
                              title="Unlock participant session so they can reconnect"
                            >
                              Unlock
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTerminate(p.id, p.name)}
                              className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200"
                              title="Manually terminate participant"
                            >
                              Lock
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete participant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generate Batch Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
                <KeyRound className="w-5 h-5 text-sky-600" />
                <span>Generate Unique Codes</span>
              </div>
              <p className="text-xs text-slate-500">
                Creates secure, unambiguous participant codes formatted as <code>KH26-XXXXX</code>.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Number of Codes to Generate:
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={batchCount}
                  onChange={(e) => setBatchCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateBatch}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm"
                >
                  {actionLoading ? "Generating..." : "Generate Codes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Names Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
                <Upload className="w-5 h-5 text-slate-800" />
                <span>Bulk Import Participant Names</span>
              </div>
              <p className="text-xs text-slate-500">
                Paste student names below (one name per line). Each will automatically receive a unique <code>KH26-XXXXX</code> code.
              </p>
              <textarea
                rows={6}
                value={importNamesText}
                onChange={(e) => setImportNamesText(e.target.value)}
                placeholder="Rahul Shaji&#10;Ananya Nair&#10;Adithya Varma"
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportNames}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm"
                >
                  {actionLoading ? "Importing..." : "Import & Generate Codes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
