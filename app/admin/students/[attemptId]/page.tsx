"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Award,
  BookOpen,
  Calendar,
  Sparkles,
} from "lucide-react";
import { DetailedAttemptReport } from "@/types";

export default function StudentProfilePage() {
  const params = useParams();
  const attemptId = params?.attemptId as string;
  const router = useRouter();

  const [report, setReport] = useState<DetailedAttemptReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/attempts/${attemptId}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleReset = async () => {
    if (!report) return;
    if (!confirm(`Allow "${report.student.name}" to retake this examination? Existing attempt answers will be cleared.`)) return;

    setResetting(true);
    try {
      const res = await fetch(`/api/admin/attempts/${attemptId}/reset`, { method: "POST" });
      if (res.ok) {
        alert("Examination attempt successfully reset!");
        router.push("/admin/students");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading student audit report...</div>;
  }

  if (!report) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800">Student Profile Not Found</h3>
        <Link href="/admin/students" className="text-xs font-semibold text-blue-600">
          ← Back to Students List
        </Link>
      </div>
    );
  }

  const { student, exam, attempt, answers } = report;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/students"
            className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Division {student.division} • Roll #{student.rollNumber}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{student.name}</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Examination: <span className="font-semibold text-slate-900">{exam.title}</span> ({exam.subject})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleReset}
            disabled={resetting}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />
            <span>{resetting ? "Resetting..." : "Reset Attempt & Allow Retake"}</span>
          </button>
        </div>
      </div>

      {/* Performance Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Score Obtained</span>
          <div className="text-2xl font-black text-slate-900">
            {attempt.marksObtained} <span className="text-sm font-semibold text-slate-400">/ {attempt.totalPossibleMarks}</span>
          </div>
        </div>

        {/* Percentage */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Percentage</span>
          <div className="text-2xl font-black text-blue-600">{attempt.percentage}%</div>
        </div>

        {/* Correct Answers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Correct</span>
          </span>
          <div className="text-2xl font-black text-emerald-600">{attempt.correctAnswers}</div>
        </div>

        {/* Incorrect Answers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center space-x-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Incorrect</span>
          </span>
          <div className="text-2xl font-black text-rose-600">{attempt.incorrectAnswers}</div>
        </div>

        {/* Unanswered */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Unanswered</span>
          </span>
          <div className="text-2xl font-black text-slate-700">{attempt.unansweredQuestions}</div>
        </div>

        {/* Total Questions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Questions</span>
          <div className="text-2xl font-black text-slate-900">{attempt.totalQuestions}</div>
        </div>
      </div>

      {/* Session Metadata Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <span className="text-slate-400 block mb-0.5">Started Session:</span>
          <span className="font-semibold text-slate-900">{new Date(attempt.startedAt).toLocaleString()}</span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">Submitted At:</span>
          <span className="font-semibold text-slate-900">
            {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "Not Submitted"}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">Attempt Status:</span>
          <span className="font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            {attempt.status}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">Candidate Email:</span>
          <span className="font-semibold text-slate-900">{student.email || "Not Provided"}</span>
        </div>
      </div>

      {/* Question-by-Question Audit Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Question-by-Question Examination Audit</h3>
            <p className="text-xs text-slate-500">
              Complete evaluation showing student selections against official answer keys in randomized order
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <span className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Correct ({attempt.correctAnswers})</span>
            </span>
            <span className="flex items-center space-x-1 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Incorrect ({attempt.incorrectAnswers})</span>
            </span>
            <span className="flex items-center space-x-1 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>Unanswered ({attempt.unansweredQuestions})</span>
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {answers.map((ans) => {
            const isCorrect = ans.status === "correct";
            const isIncorrect = ans.status === "incorrect";
            const isUnanswered = ans.status === "unanswered";

            return (
              <div key={ans.questionId} className="p-6 space-y-3 hover:bg-slate-50/60 transition">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <span
                      className={`w-7 h-7 rounded-xl text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isCorrect
                          ? "bg-emerald-100 text-emerald-800"
                          : isIncorrect
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ans.questionNumber}
                    </span>
                    <p className="text-sm font-bold text-slate-900 leading-relaxed">{ans.questionText}</p>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 ${
                        isCorrect
                          ? "bg-emerald-100 text-emerald-800"
                          : isIncorrect
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isCorrect && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isIncorrect && <XCircle className="w-3.5 h-3.5" />}
                      {isUnanswered && <HelpCircle className="w-3.5 h-3.5" />}
                      <span className="capitalize">{ans.status}</span>
                    </span>

                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {ans.marksAwarded > 0 ? `+${ans.marksAwarded}` : ans.marksAwarded} Marks
                    </span>
                  </div>
                </div>

                {/* Choices breakdown & Comparison */}
                <div className="pl-10 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                  <div
                    className={`p-3.5 rounded-xl border ${
                      isCorrect
                        ? "bg-emerald-50/60 border-emerald-300"
                        : isIncorrect
                        ? "bg-rose-50/60 border-rose-300"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Student's Selected Answer:</span>
                    {ans.selectedAnswerKey ? (
                      <div className="font-semibold text-slate-900">
                        <span className="font-bold text-blue-600 mr-1.5">Option {ans.selectedAnswerKey}:</span>
                        <span>{ans.selectedAnswerText}</span>
                      </div>
                    ) : (
                      <span className="italic text-slate-400">Unanswered (No option selected)</span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl border bg-emerald-50/40 border-emerald-200">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-1">Official Correct Answer:</span>
                    <div className="font-semibold text-emerald-950">
                      <span className="font-bold text-emerald-700 mr-1.5">Option {ans.correctAnswerKey}:</span>
                      <span>{ans.correctAnswerText}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
