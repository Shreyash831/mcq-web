"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  Filter,
  Download,
  ExternalLink,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
} from "lucide-react";

function StudentsTable() {
  const searchParams = useSearchParams();
  const initialExamFilter = searchParams.get("examId") || "";

  const [attempts, setAttempts] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState(initialExamFilter);
  const [divisionFilter, setDivisionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  const [actionMsg, setActionMsg] = useState("");

  const fetchData = async () => {
    try {
      const q = new URLSearchParams();
      if (examFilter) q.set("examId", examFilter);
      if (divisionFilter) q.set("division", divisionFilter);
      if (statusFilter) q.set("status", statusFilter);
      if (search) q.set("search", search);
      q.set("sortBy", sortBy);
      q.set("sortOrder", sortOrder);

      const [attemptsRes, examsRes] = await Promise.all([
        fetch(`/api/admin/attempts?${q.toString()}`),
        fetch("/api/admin/exams"),
      ]);

      if (attemptsRes.ok) {
        const d = await attemptsRes.json();
        setAttempts(d.attempts || []);
      }
      if (examsRes.ok) {
        const ed = await examsRes.json();
        setExams(ed.exams || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [examFilter, divisionFilter, statusFilter, sortBy, sortOrder, search]);

  const handleResetAttempt = async (attemptId: string, studentName: string) => {
    if (!confirm(`Reset examination attempt for "${studentName}"? This will allow the student to retake the test.`)) return;

    try {
      const res = await fetch(`/api/admin/attempts/${attemptId}/reset`, { method: "POST" });
      if (res.ok) {
        setActionMsg(`Attempt reset for ${studentName}. Student can now retake.`);
        setTimeout(() => setActionMsg(""), 4000);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAttempt = async (attemptId: string) => {
    if (!confirm("Permanently delete this student's attempt record?")) return;

    try {
      const res = await fetch(`/api/admin/attempts/${attemptId}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Divisions set
  const divisions = Array.from(new Set(attempts.map((a) => a.division).filter(Boolean)));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Performance & Results</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Student-wise marks, score percentages, question-by-question analysis, and attempt control.
          </p>
        </div>

        <Link
          href={`/api/admin/export${examFilter ? `?examId=${examFilter}` : ""}`}
          download
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition"
        >
          <Download className="w-4 h-4" />
          <span>Export Results CSV</span>
        </Link>
      </div>

      {actionMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Global Search */}
          <div className="lg:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by student name, roll number, or division..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Exam Filter */}
          <div>
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Examinations</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </select>
          </div>

          {/* Division Filter */}
          <div>
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Divisions</option>
              {divisions.map((div) => (
                <option key={div} value={div}>
                  Division {div}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("-");
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="date-desc">Latest Submissions</option>
              <option value="marks-desc">Highest Marks</option>
              <option value="marks-asc">Lowest Marks</option>
              <option value="name-asc">Student Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Results Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-4 py-3.5">Roll No</th>
                <th className="px-4 py-3.5">Division</th>
                <th className="px-5 py-3.5">Examination</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Marks Obtained</th>
                <th className="px-4 py-3.5">Percentage</th>
                <th className="px-4 py-3.5">Submitted At</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    Loading student records...
                  </td>
                </tr>
              ) : attempts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    No student submissions found matching your filters.
                  </td>
                </tr>
              ) : (
                attempts.map((att) => {
                  const isSubmitted = att.status === "submitted" || att.status === "expired";
                  return (
                    <tr key={att.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4 font-bold text-slate-900">
                        <Link href={`/admin/students/${att.id}`} className="hover:text-blue-600 transition">
                          {att.studentName}
                        </Link>
                        {att.email && <div className="text-[11px] font-normal text-slate-400">{att.email}</div>}
                      </td>
                      <td className="px-4 py-4 font-mono font-medium text-slate-700">{att.rollNumber}</td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-800">
                          {att.division}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-800 max-w-xs truncate">{att.examTitle}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            att.status === "submitted"
                              ? "bg-emerald-100 text-emerald-800"
                              : att.status === "expired"
                              ? "bg-slate-200 text-slate-700"
                              : "bg-blue-100 text-blue-800 animate-pulse"
                          }`}
                        >
                          {att.status === "submitted"
                            ? "Submitted"
                            : att.status === "expired"
                            ? "Auto-Submitted"
                            : "In Progress"}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-black text-slate-900">
                        {isSubmitted ? `${att.marksObtained} / ${att.totalPossibleMarks}` : "—"}
                      </td>
                      <td className="px-4 py-4">
                        {isSubmitted ? (
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold ${
                              att.percentage >= 75
                                ? "bg-emerald-100 text-emerald-800"
                                : att.percentage >= 50
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {att.percentage}%
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-500">
                        {att.submittedAt ? new Date(att.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "In Session"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Link
                            href={`/admin/students/${att.id}`}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition"
                          >
                            <span>Profile Audit</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>

                          <button
                            onClick={() => handleResetAttempt(att.id, att.studentName)}
                            title="Reset Attempt (Allow Retake)"
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition border border-slate-200"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteAttempt(att.id)}
                            title="Delete Attempt Record"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition border border-slate-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading student results table...</div>}>
      <StudentsTable />
    </Suspense>
  );
}
