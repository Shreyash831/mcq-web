"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Send,
  Flag,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Menu,
} from "lucide-react";
import ExamTimer from "@/components/student/ExamTimer";
import QuestionPalette from "@/components/student/QuestionPalette";
import Modal from "@/components/ui/Modal";
import { StudentExamSession, SanitizedQuestion, OptionKey } from "@/types";

export default function StudentExamPage() {
  const params = useParams();
  const attemptId = params?.attemptId as string;
  const router = useRouter();

  const [session, setSession] = useState<StudentExamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visitedIndices, setVisitedIndices] = useState<Set<number>>(new Set([0]));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);

  // Fetch session & sanitized questions
  const loadExam = useCallback(async () => {
    try {
      const res = await fetch(`/api/student/exam/${attemptId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load examination.");
      }

      if (data.isSubmitted) {
        router.replace(`/student/exam/${attemptId}/submitted`);
        return;
      }

      setSession(data.session);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect to the examination server.");
    } finally {
      setLoading(false);
    }
  }, [attemptId, router]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  // Handle Option Selection with Auto-Save
  const handleSelectOption = async (optionKey: OptionKey) => {
    if (!session) return;
    const currentQ = session.questions[currentIndex];
    const newQuestions = [...session.questions];

    // Toggle or update
    const selected = currentQ.selectedAnswer === optionKey ? null : optionKey;
    newQuestions[currentIndex] = {
      ...currentQ,
      selectedAnswer: selected,
    };

    setSession({ ...session, questions: newQuestions });
    setSavingAnswer(true);

    try {
      await fetch("/api/student/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          questionId: currentQ.id,
          selectedAnswer: selected,
          isFlagged: currentQ.isFlagged,
        }),
      });
    } catch (err) {
      console.error("Auto-save failed:", err);
    } finally {
      setSavingAnswer(false);
    }
  };

  // Toggle Flag for review
  const handleToggleFlag = async () => {
    if (!session) return;
    const currentQ = session.questions[currentIndex];
    const newFlag = !currentQ.isFlagged;
    const newQuestions = [...session.questions];

    newQuestions[currentIndex] = {
      ...currentQ,
      isFlagged: newFlag,
    };

    setSession({ ...session, questions: newQuestions });

    try {
      await fetch("/api/student/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          questionId: currentQ.id,
          selectedAnswer: currentQ.selectedAnswer,
          isFlagged: newFlag,
        }),
      });
    } catch (err) {
      console.error("Flag update failed:", err);
    }
  };

  // Clear Response
  const handleClearAnswer = async () => {
    if (!session) return;
    const currentQ = session.questions[currentIndex];
    const newQuestions = [...session.questions];

    newQuestions[currentIndex] = {
      ...currentQ,
      selectedAnswer: null,
    };

    setSession({ ...session, questions: newQuestions });

    try {
      await fetch("/api/student/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          questionId: currentQ.id,
          selectedAnswer: null,
          isFlagged: currentQ.isFlagged,
        }),
      });
    } catch (err) {
      console.error("Clear response failed:", err);
    }
  };

  const handleNavigate = (newIdx: number) => {
    if (!session || newIdx < 0 || newIdx >= session.questions.length) return;
    setCurrentIndex(newIdx);
    setVisitedIndices((prev) => new Set([...Array.from(prev), newIdx]));
    setShowMobilePalette(false);
  };

  // Submit Examination
  const handleSubmitExam = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/student/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit examination.");
      }

      router.replace(`/student/exam/${attemptId}/submitted`);
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600">Connecting to secure examination server...</p>
      </div>
    );
  }

  if (errorMsg || !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-red-200 text-center shadow-xl space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
          <p className="text-xs text-slate-600">{errorMsg || "Unable to retrieve examination session."}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
          >
            Return to Portal Home
          </button>
        </div>
      </div>
    );
  }

  const currentQ: SanitizedQuestion = session.questions[currentIndex];
  const answeredCount = session.questions.filter((q) => Boolean(q.selectedAnswer)).length;

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col no-copy">
      {/* Top Examination Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Exam & Subject */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate max-w-[200px] sm:max-w-md">
                {session.examTitle}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                {session.subject} • Candidate: <span className="text-slate-900 font-semibold">{session.student.name}</span> (Roll: {session.student.rollNumber}, Div: {session.student.division})
              </p>
            </div>
          </div>

          {/* Timer & Mobile Palette Trigger */}
          <div className="flex items-center space-x-3">
            <ExamTimer expiresAt={session.expiresAt} onTimeExpired={handleSubmitExam} />

            <button
              onClick={() => setShowMobilePalette(!showMobilePalette)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              title="Question Palette"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Question Area (Left / Center) */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            {/* Question Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-200/60">
                  Question {currentIndex + 1} of {session.questions.length}
                </span>
                {savingAnswer && (
                  <span className="text-[11px] text-slate-400 animate-pulse font-medium">Saving response...</span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleToggleFlag}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    currentQ.isFlagged
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Flag className={`w-3.5 h-3.5 ${currentQ.isFlagged ? "fill-amber-500 text-amber-500" : ""}`} />
                  <span>{currentQ.isFlagged ? "Flagged for Review" : "Flag for Review"}</span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed pt-2">
              {currentQ.questionText}
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {(["A", "B", "C", "D"] as OptionKey[]).map((optKey) => {
                const optionText = currentQ.options[optKey];
                const isSelected = currentQ.selectedAnswer === optKey;

                return (
                  <button
                    key={optKey}
                    type="button"
                    onClick={() => handleSelectOption(optKey)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center space-x-4 ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 shadow-md shadow-blue-500/10"
                        : "border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 bg-white"
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {optKey}
                    </span>
                    <span className={`text-sm sm:text-base font-medium flex-1 ${isSelected ? "text-blue-950 font-semibold" : "text-slate-800"}`}>
                      {optionText}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Clear Answer action */}
            {currentQ.selectedAnswer && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleClearAnswer}
                  className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Selection</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-3">
            <button
              onClick={() => handleNavigate(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition transform active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Submit Examination</span>
              </button>
            </div>

            <button
              onClick={() => handleNavigate(currentIndex + 1)}
              disabled={currentIndex === session.questions.length - 1}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition disabled:opacity-30 disabled:pointer-events-none"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sidebar Question Palette (Desktop) */}
        <div className="hidden lg:block lg:col-span-4 space-y-6">
          <QuestionPalette
            questions={session.questions}
            currentIndex={currentIndex}
            visitedIndices={visitedIndices}
            onSelectQuestion={handleNavigate}
          />

          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 space-y-1">
            <p className="font-bold flex items-center space-x-1.5">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Exam Navigation Tips:</span>
            </p>
            <p className="text-blue-800">
              Click any number on the palette to jump directly to that question. Your answers are auto-saved in real-time.
            </p>
          </div>
        </div>
      </main>

      {/* Mobile Drawer Question Palette */}
      {showMobilePalette && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="w-80 bg-white h-full p-6 shadow-2xl overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Question Navigation</h3>
              <button
                onClick={() => setShowMobilePalette(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>
            <QuestionPalette
              questions={session.questions}
              currentIndex={currentIndex}
              visitedIndices={visitedIndices}
              onSelectQuestion={handleNavigate}
            />
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Confirm Examination Submission"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs space-y-1.5">
            <p className="font-bold text-sm">Are you sure you want to finish and submit?</p>
            <p className="text-amber-800">
              You will not be able to modify your answers once submitted.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 space-y-2 font-medium">
            <div className="flex justify-between">
              <span>Total Questions:</span>
              <span className="font-bold text-slate-900">{session.questions.length}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Answered Questions:</span>
              <span className="font-bold">{answeredCount}</span>
            </div>
            <div className="flex justify-between text-rose-700">
              <span>Unanswered Questions:</span>
              <span className="font-bold">{session.questions.length - answeredCount}</span>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3">
            <button
              onClick={() => setShowSubmitModal(false)}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Return to Test
            </button>
            <button
              onClick={handleSubmitExam}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
            >
              {isSubmitting ? "Submitting Answers..." : "Yes, Submit Examination"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
