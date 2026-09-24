"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  Upload,
  CheckCircle2,
  Clock,
  Award,
  Loader2,
  FileText,
} from "lucide-react";
import Papa from "papaparse";

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Question Form
  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [marks, setMarks] = useState(2.0);
  const [negativeMarks, setNegativeMarks] = useState(0.5);
  const [timeLimit, setTimeLimit] = useState(30);
  const [explanation, setExplanation] = useState("");

  // Bulk Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/questions");
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions || []);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setQuestionText("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectAnswer("A");
    setMarks(2.0);
    setNegativeMarks(0.5);
    setTimeLimit(30);
    setExplanation("");
    setShowModal(true);
  };

  const openEditModal = (q: any) => {
    setIsEditing(true);
    setEditingId(q.id);
    setQuestionText(q.questionText);
    setOptionA(q.optionA);
    setOptionB(q.optionB);
    setOptionC(q.optionC);
    setOptionD(q.optionD);
    setCorrectAnswer(q.correctAnswer);
    setMarks(q.marks);
    setNegativeMarks(q.negativeMarks);
    setTimeLimit(q.timeLimit);
    setExplanation(q.explanation || "");
    setShowModal(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const payload = {
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        marks: Number(marks),
        negativeMarks: Number(negativeMarks),
        timeLimit: Number(timeLimit),
        explanation,
      };

      let res;
      if (isEditing) {
        res = await fetch("/api/admin/questions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
      } else {
        res = await fetch("/api/admin/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        setMessage(isEditing ? "Question updated." : "New question added.");
        setShowModal(false);
        fetchQuestions();
      } else {
        alert(data.error || "Save failed.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, num: number) => {
    if (!confirm(`Are you sure you want to delete Question ${num}?`)) return;

    try {
      await fetch(`/api/admin/questions?id=${id}`, { method: "DELETE" });
      fetchQuestions();
    } catch {
      alert("Failed to delete.");
    }
  };

  const handleBulkImport = async () => {
    let parsed: any[] = [];
    try {
      parsed = JSON.parse(importJsonText);
    } catch {
      alert("Invalid JSON format. Please provide a valid JSON array of questions.");
      return;
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      alert("Must be an array of question objects.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: parsed }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        setShowImportModal(false);
        setImportJsonText("");
        fetchQuestions();
      } else {
        alert(data.error || "Import failed.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const sampleJson = JSON.stringify(
    [
      {
        questionText: "Which layer of the OSI model handles end-to-end reliability?",
        optionA: "Network",
        optionB: "Transport",
        optionC: "Data Link",
        optionD: "Session",
        correctAnswer: "B",
        marks: 2.0,
        negativeMarks: 0.5,
        timeLimit: 30,
        explanation: "Transport layer handles TCP end-to-end reliability.",
      },
    ],
    null,
    2
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Question Bank Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure question prompts, options, server-authoritative correct keys, marks, and timers
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Bulk JSON Import</span>
            </button>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{message}</span>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Questions Added</h3>
              <p className="text-xs text-slate-400 mt-1">
                Add questions manually or run the seed script.
              </p>
            </div>
          ) : (
            questions.map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {q.questionNumber}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {q.questionText}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-500">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          Answer: {q.correctAnswer}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                          +{q.marks} / -{q.negativeMarks} pts
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                          <Clock className="w-3 h-3 mr-1" /> {q.timeLimit}s limit
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => openEditModal(q)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id, q.questionNumber)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div
                    className={`p-3 rounded-xl border flex items-center space-x-2 ${
                      q.correctAnswer === "A"
                        ? "bg-emerald-50/70 border-emerald-300 font-bold text-emerald-900"
                        : "bg-slate-50 border-slate-100 text-slate-700"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-md bg-white border flex items-center justify-center font-mono text-[10px]">
                      A
                    </span>
                    <span>{q.optionA}</span>
                  </div>
                  <div
                    className={`p-3 rounded-xl border flex items-center space-x-2 ${
                      q.correctAnswer === "B"
                        ? "bg-emerald-50/70 border-emerald-300 font-bold text-emerald-900"
                        : "bg-slate-50 border-slate-100 text-slate-700"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-md bg-white border flex items-center justify-center font-mono text-[10px]">
                      B
                    </span>
                    <span>{q.optionB}</span>
                  </div>
                  <div
                    className={`p-3 rounded-xl border flex items-center space-x-2 ${
                      q.correctAnswer === "C"
                        ? "bg-emerald-50/70 border-emerald-300 font-bold text-emerald-900"
                        : "bg-slate-50 border-slate-100 text-slate-700"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-md bg-white border flex items-center justify-center font-mono text-[10px]">
                      C
                    </span>
                    <span>{q.optionC}</span>
                  </div>
                  <div
                    className={`p-3 rounded-xl border flex items-center space-x-2 ${
                      q.correctAnswer === "D"
                        ? "bg-emerald-50/70 border-emerald-300 font-bold text-emerald-900"
                        : "bg-slate-50 border-slate-100 text-slate-700"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-md bg-white border flex items-center justify-center font-mono text-[10px]">
                      D
                    </span>
                    <span>{q.optionD}</span>
                  </div>
                </div>

                {q.explanation && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="font-bold">Explanation: </span>
                    {q.explanation}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Create / Edit Question Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200 my-8">
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? "Edit Question" : "Add New Question"}
              </h2>

              <form onSubmit={handleSaveQuestion} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Question Text
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-slate-900 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Option A
                    </label>
                    <input
                      type="text"
                      required
                      value={optionA}
                      onChange={(e) => setOptionA(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Option B
                    </label>
                    <input
                      type="text"
                      required
                      value={optionB}
                      onChange={(e) => setOptionB(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Option C
                    </label>
                    <input
                      type="text"
                      required
                      value={optionC}
                      onChange={(e) => setOptionC(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Option D
                    </label>
                    <input
                      type="text"
                      required
                      value={optionD}
                      onChange={(e) => setOptionD(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Correct Key
                    </label>
                    <select
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 font-bold"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Marks
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={marks}
                      onChange={(e) => setMarks(Number(e.target.value))}
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Neg. Marks
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      value={negativeMarks}
                      onChange={(e) => setNegativeMarks(Number(e.target.value))}
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Seconds
                    </label>
                    <input
                      type="number"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(Number(e.target.value))}
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Explanation (Optional)
                  </label>
                  <input
                    type="text"
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
                  >
                    {actionLoading ? "Saving..." : "Save Question"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Import JSON Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                Bulk Import Questions (JSON Format)
              </h2>
              <p className="text-xs text-slate-500">
                Paste an array of questions conforming to the format below:
              </p>
              <textarea
                rows={8}
                value={importJsonText || sampleJson}
                onChange={(e) => setImportJsonText(e.target.value)}
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm"
                >
                  {actionLoading ? "Importing..." : "Run Bulk Import"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
