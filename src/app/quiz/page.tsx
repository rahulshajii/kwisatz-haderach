"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Wifi,
  WifiOff,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

interface QuestionData {
  id: string;
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  marks: number;
  negativeMarks: number;
  timeLimit: number;
}

export default function QuizPage() {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(20);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [connected, setConnected] = useState(true);
  const [warningModal, setWarningModal] = useState<{
    show: boolean;
    count: number;
    max: number;
    message: string;
  } | null>(null);

  // Timing references
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());
  const isTerminatedRef = useRef<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);

  // 1. Log Anti-Cheat Event
  const logAntiCheatEvent = useCallback(
    async (eventType: string, metadata?: Record<string, any>) => {
      if (isTerminatedRef.current) return;

      try {
        const res = await fetch("/api/participant/log-activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventType, metadata }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.failed) {
            isTerminatedRef.current = true;
            router.push("/failed");
          } else if (data.shouldAlert) {
            setWarningModal({
              show: true,
              count: data.warningCount,
              max: data.maxWarnings,
              message: data.message,
            });
          }
        }
      } catch (err) {
        console.error("Anti-cheat logging failed:", err);
      }
    },
    [router]
  );

  // 2. Fetch current question
  const fetchCurrentQuestion = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/participant/quiz-data");

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        const data = await res.json();
        if (data.status === "FAILED") {
          router.push("/failed");
        } else {
          router.push("/waiting");
        }
        return;
      }

      if (!res.ok) {
        setConnected(false);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setConnected(true);

      if (data.completed) {
        router.push("/result");
        return;
      }

      if (data.quizStatus && data.quizStatus !== "RUNNING") {
        router.push("/waiting");
        return;
      }

      if (data.question) {
        setQuestion(data.question);
        setCurrentNumber(data.currentQuestionIndex || data.question.questionNumber);
        setTotalQuestions(data.totalQuestions || 20);
        setSelectedOption(null);
        setTimeLeft(data.question.timeLimit || 30);
        questionStartTimeRef.current = Date.now();
      }

      setLoading(false);
    } catch {
      setConnected(false);
      setLoading(false);
    }
  }, [router]);

  // 3. Submit Answer
  const submitAnswer = useCallback(
    async (option: string) => {
      if (isSubmittingRef.current || !question) return;

      isSubmittingRef.current = true;
      setIsSubmitting(true);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      const timeTakenMs = Date.now() - questionStartTimeRef.current;

      try {
        const res = await fetch("/api/participant/submit-answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: question.id,
            selectedAnswer: option,
            timeTakenMs,
          }),
        });

        const data = await res.json();

        if (res.status === 403) {
          router.push("/failed");
          return;
        }

        if (data.isFinished) {
          router.push("/result");
        } else {
          // Load next question
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          await fetchCurrentQuestion();
        }
      } catch (err) {
        // Network retry
        setConnected(false);
        setTimeout(() => {
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          submitAnswer(option);
        }, 1500);
      }
    },
    [question, router, fetchCurrentQuestion]
  );

  // 4. Timer Countdown effect
  useEffect(() => {
    if (!question || isSubmitting) return;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          submitAnswer("TIMEOUT");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question, isSubmitting, submitAnswer]);

  // 5. Anti-Cheating Event Listeners (Section 14 & 18)
  useEffect(() => {
    // A. Page Visibility & Tab Switch
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logAntiCheatEvent("PAGE_HIDDEN", { timestamp: Date.now() });
      } else {
        logAntiCheatEvent("WINDOW_FOCUS", { timestamp: Date.now() });
      }
    };

    // B. Window Blur & Focus
    const handleWindowBlur = () => {
      logAntiCheatEvent("WINDOW_BLUR", { timestamp: Date.now() });
    };

    const handleWindowFocus = () => {
      logAntiCheatEvent("WINDOW_FOCUS", { timestamp: Date.now() });
    };

    // C. Fullscreen Exit
    const handleFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement || (document as any).webkitFullscreenElement
      );
      if (!isFs) {
        logAntiCheatEvent("FULLSCREEN_EXIT", { timestamp: Date.now() });
      }
    };

    // D. Back button trap
    window.history.pushState(null, "", window.location.href);
    const handlePopState = (e: PopStateEvent) => {
      window.history.pushState(null, "", window.location.href);
      logAntiCheatEvent("BACK_NAVIGATION", { timestamp: Date.now() });
    };

    // E. Network offline/online listeners
    const handleOnline = () => setConnected(true);
    const handleOffline = () => setConnected(false);

    // Attach listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial fetch
    fetchCurrentQuestion();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [logAntiCheatEvent, fetchCurrentQuestion]);

  const handleSelectOption = (key: string) => {
    if (isSubmitting || !question) return;
    setSelectedOption(key);
    submitAnswer(key);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Syncing Question...
        </p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Quiz Inactive</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">Waiting for administrator action.</p>
        <button
          onClick={() => router.push("/waiting")}
          className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold"
        >
          Go to Waiting Room
        </button>
      </div>
    );
  }

  const options = [
    { key: "A", text: question.optionA },
    { key: "B", text: question.optionB },
    { key: "C", text: question.optionC },
    { key: "D", text: question.optionD },
  ];

  // Timer warning style
  const isTimeCritical = timeLeft <= 5;
  const progressPercent = Math.min(100, Math.round((currentNumber / totalQuestions) * 100));

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-between p-3 sm:p-4 select-none">
      {/* Warning Alert Modal (Section 15) */}
      {warningModal?.show && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border border-rose-200 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-rose-900 tracking-tight">
              PROHIBITED ACTIVITY DETECTED
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {warningModal.message}
            </p>
            <div className="my-4 py-2 px-3 bg-rose-50 rounded-xl text-xs font-mono font-bold text-rose-700 border border-rose-100">
              WARNING {warningModal.count} / {warningModal.max}
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Switching tabs, minimizing the browser, or leaving the window again will terminate your quiz session.
            </p>
            <button
              onClick={() => setWarningModal(null)}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
            >
              I UNDERSTAND — RESUME QUIZ
            </button>
          </div>
        </div>
      )}

      {/* Top Header Bar: Progress, Connection, Timer */}
      <div className="max-w-md mx-auto w-full pt-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black text-slate-800 tracking-tight">
              Q{currentNumber} <span className="text-slate-400 font-normal">/ {totalQuestions}</span>
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-100/70 text-sky-700">
              +{question.marks} / -{question.negativeMarks} pts
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Connection Indicator */}
            <div
              className={`flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                connected
                  ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                  : "text-amber-700 bg-amber-50 border border-amber-200 animate-pulse"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1 ${
                  connected ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {connected ? "Online" : "Reconnecting"}
            </div>

            {/* Timer Badge */}
            <div
              className={`flex items-center space-x-1 px-3 py-1 rounded-xl font-mono text-sm font-black transition-colors ${
                isTimeCritical
                  ? "bg-rose-600 text-white animate-bounce shadow-md"
                  : "bg-slate-900 text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="max-w-md mx-auto w-full my-auto py-3 space-y-3">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-card">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>Question {currentNumber} of {totalQuestions}</span>
            <span>Single Choice</span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {question.questionText}
          </h2>
        </div>

        {/* 4 Large Touch-Friendly Option Buttons */}
        <div className="space-y-2.5">
          {options.map((opt) => {
            const isSelected = selectedOption === opt.key;
            return (
              <button
                key={opt.key}
                disabled={isSubmitting}
                onClick={() => handleSelectOption(opt.key)}
                className={`w-full p-4 rounded-2xl border text-left flex items-center space-x-3.5 transition-all duration-150 active:scale-[0.98] ${
                  isSelected
                    ? "bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-600/25"
                    : "bg-white hover:bg-slate-50 border-slate-200/90 text-slate-900 shadow-sm"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0 transition-colors ${
                    isSelected
                      ? "bg-white text-sky-600"
                      : "bg-slate-100 text-slate-700 group-hover:bg-slate-200"
                  }`}
                >
                  {opt.key}
                </div>
                <div className="flex-1 text-sm font-semibold leading-snug">
                  {opt.text}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Minimal Footer / Warning */}
      <div className="max-w-md mx-auto w-full pb-1 text-center">
        <div className="inline-flex items-center text-[10px] text-slate-400">
          <span>Active Quiz Monitored • Tap an option to submit</span>
        </div>
      </div>
    </main>
  );
}
