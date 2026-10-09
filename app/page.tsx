"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  ShieldCheck,
  Shuffle,
  Clock,
  FileSpreadsheet,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Users,
} from "lucide-react";

export default function HomePage() {
  const [activeExams, setActiveExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveExams = () => {
    fetch("/api/student/exams")
      .then((res) => res.json())
      .then((data) => {
        if (data.exams) setActiveExams(data.exams);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchActiveExams();
    const interval = setInterval(fetchActiveExams, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      {/* Top Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">MCQ ExamPortal</span>
              <span className="text-[10px] ml-2 uppercase font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                Secure v2.0
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/admin/login"
              className="inline-flex items-center space-x-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition border border-slate-200"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Admin Login</span>
            </Link>
            <Link
              href="/student/register"
              className="inline-flex items-center space-x-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-md shadow-blue-600/20 transition transform active:scale-95"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Institutional Examination & Assessment Portal</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Select Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Access Portal</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Choose your role below to enter the examination hall or manage institutional assessments.
          </p>
        </div>

        {/* Two Main Dual Portal Cards (Student vs Admin) */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Card 1: Student Portal */}
          <div className="bg-white rounded-3xl border-2 border-blue-100 p-8 shadow-xl shadow-blue-500/5 flex flex-col justify-between hover:border-blue-500 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none"></div>
            
            <div className="space-y-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <GraduationCap className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  Candidate Entry
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-2">Student Examination Room</h2>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Take your live scheduled test with server-side question & option randomization, automatic timers, and real-time auto-saving.
              </p>

              <div className="pt-2 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>No password required • Enter Name & Roll No</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Server-side anti-leak grading protection</span>
                </div>
              </div>
            </div>

            <div className="pt-8 relative z-10">
              <Link
                href="/student/register"
                className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/25 transition transform active:scale-95 group-hover:bg-blue-700"
              >
                <span>Enter as Student (Take Test)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </Link>
            </div>
          </div>

          {/* Card 2: Admin Portal */}
          <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 p-8 shadow-xl shadow-slate-950/20 flex flex-col justify-between hover:border-slate-700 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full pointer-events-none"></div>

            <div className="space-y-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-700 text-white flex items-center justify-center shadow-lg">
                <Lock className="w-7 h-7 text-indigo-400" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-md border border-indigo-800/50">
                  Faculty & Controller
                </span>
                <h2 className="text-2xl font-bold text-white mt-2">Administrator Portal</h2>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Upload question papers (PDF, Excel, CSV), manage live assessments, monitor student submissions in real time, and export spreadsheets.
              </p>

              <div className="pt-2 space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>Strict Password & Email Authentication</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>Full student audit & gradebook controls</span>
                </div>
              </div>
            </div>

            <div className="pt-8 relative z-10">
              <Link
                href="/admin/login"
                className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-2xl shadow-lg transition transform active:scale-95"
              >
                <span>Admin Sign In (Control Center)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </Link>
            </div>
          </div>
        </div>

        {/* Active Examinations List */}
        <div className="mt-16 max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Available Active Examinations</h2>
              <p className="text-sm text-slate-500">Students can select from any scheduled live assessments below</p>
            </div>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Assessment Room</span>
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-44 bg-slate-100 animate-pulse rounded-2xl"></div>
              ))}
            </div>
          ) : activeExams.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-slate-500 font-medium">No active examinations available right now.</p>
              <p className="text-xs text-slate-400 mt-1">Please login as Administrator to create or activate exams.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeExams.map((exam) => (
                <div
                  key={exam.id}
                  className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                        {exam.subject}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exam.durationMinutes} Mins</span>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{exam.description || "Comprehensive assessment."}</p>
                  </div>

                  <div className="pt-6 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-900">{exam.totalQuestions}</span> Questions •{" "}
                      <span className="font-semibold text-slate-900">{exam.marksPerQuestion}</span> Mark/Q
                    </div>
                    <Link
                      href={`/student/register?examId=${exam.id}`}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                    >
                      <span>Enter</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Shuffle className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Dual Randomization</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every student gets randomized question sequence and option permutations generated server-side.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Zero Client Leaks</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Correct answers and marks are stripped from student APIs. Scoring executes strictly on the backend.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">CSV & Excel Importer</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bulk import hundreds of questions with row-by-row validation, error reporting, and table preview.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Student-Wise Auditing</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Inspect question-level answers, time taken, accuracy, and export results directly to CSV.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 space-y-2">
        <p className="font-medium text-slate-700">
          Developed by <span className="font-bold text-slate-900">Suhas Gage</span> • Contact:{" "}
          <a href="tel:9021085949" className="font-bold text-blue-600 hover:text-blue-800 transition">
            9021085949
          </a>
        </p>
        <p>© 2026 MCQ Examination Portal. Confidential assessment system. Results accessible by authorized administrators only.</p>
      </footer>
    </div>
  );
}
