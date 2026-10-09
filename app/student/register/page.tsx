"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GraduationCap, ArrowRight, AlertCircle, Clock, BookOpen, User, Hash, School, Sparkles, CheckCircle2 } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedExamId = searchParams.get("examId") || "";

  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState(preselectedExamId);
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [division, setDivision] = useState("A");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingExams, setFetchingExams] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchActiveExams = useCallback(async () => {
    try {
      const res = await fetch("/api/student/exams");
      if (res.ok) {
        const data = await res.json();
        if (data.exams) {
          setExams(data.exams);
          if (!selectedExamId && data.exams.length > 0) {
            setSelectedExamId(preselectedExamId || data.exams[0].id);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingExams(false);
    }
  }, [preselectedExamId, selectedExamId]);

  useEffect(() => {
    fetchActiveExams();
    // Dynamic polling every 4 seconds so newly uploaded exams by admin appear instantly
    const interval = setInterval(fetchActiveExams, 4000);
    return () => clearInterval(interval);
  }, [fetchActiveExams]);

  const selectedExam = exams.find((e) => e.id === selectedExamId) || (exams.length > 0 ? exams[0] : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const targetExamId = selectedExamId || selectedExam?.id;

    if (!name.trim() || !rollNumber.trim() || !division.trim() || !email.trim() || !targetExamId) {
      setErrorMsg("Please fill in all required fields (Full Name, Roll Number, Division, and Email).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/student/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          rollNumber: rollNumber.trim(),
          division: division.trim().toUpperCase(),
          email: email.trim(),
          examId: targetExamId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start examination.");
      }

      router.push(`/student/exam/${data.attemptId}`);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while entering the examination.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 mb-4">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Student Examination Entry</h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600">
          Enter your candidate credentials to begin your scheduled assessment
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to Proceed</p>
                <p className="text-xs mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Exam Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Examination *
                </label>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Live Updated</span>
                </span>
              </div>

              {fetchingExams && exams.length === 0 ? (
                <div className="h-11 bg-slate-100 animate-pulse rounded-xl"></div>
              ) : exams.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  No active examinations currently available. Please wait for your instructor to launch the test.
                </div>
              ) : (
                <select
                  value={selectedExamId || selectedExam?.id}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                >
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title} ({exam.subject}) • {exam.totalQuestions} Questions • {exam.durationMinutes} mins
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Selected Exam Details Card */}
            {selectedExam && (
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs space-y-2 text-blue-900">
                <div className="flex items-center justify-between font-bold text-blue-950">
                  <span className="flex items-center space-x-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>{selectedExam.subject} Assessment</span>
                  </span>
                  <span className="flex items-center space-x-1 text-blue-700">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{selectedExam.durationMinutes} Minutes</span>
                  </span>
                </div>
                <p className="text-blue-800">{selectedExam.description || "Comprehensive timed examination."}</p>
                <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between font-semibold text-blue-800">
                  <span>Questions: {selectedExam.totalQuestions}</span>
                  <span>Marks/Q: {selectedExam.marksPerQuestion}</span>
                  <span>Neg. Marking: {selectedExam.negativeMarks > 0 ? `-${selectedExam.negativeMarks}` : "None"}</span>
                </div>
              </div>
            )}

            {/* Student Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Patil"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Roll Number and Division */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Roll Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 23"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Division / Section *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <School className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A"
                    value={division}
                    onChange={(e) => setDivision(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="student@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Anti-Cheating & Policy Notice */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">📌 Secure Examination Protocol:</p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                <li className="font-medium text-slate-700">Every candidate must have a unique Full Name and unique Email Address. Repeated names or emails are prohibited.</li>
                <li>Questions and options are randomized for each student.</li>
                <li>Your responses are automatically synced and saved in real-time.</li>
                <li>When the timer hits 0:00, your test will submit automatically.</li>
                <li>Results are strictly recorded into the admin gradebook.</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || fetchingExams || exams.length === 0}
              className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition transform active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? "Generating Randomized Session..." : "Start Examination Now"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs font-medium text-slate-500 hover:text-blue-600">
              ← Return to Main Portal
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500">
          <p>
            Developed by <span className="font-bold text-slate-800">Suhas Gage</span> • Contact:{" "}
            <a href="tel:9021085949" className="text-blue-600 hover:text-blue-800 font-semibold transition">
              9021085949
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function StudentRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading examination portal...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
