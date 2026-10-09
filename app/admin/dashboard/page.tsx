"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Users,
  Award,
  CheckCircle2,
  TrendingUp,
  Plus,
  ArrowRight,
  Download,
  Clock,
  Sparkles,
  ExternalLink,
  UploadCloud,
  Copy,
  Check,
  FileText,
  Eye,
  RefreshCw,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import QuestionUploader from "@/components/admin/QuestionUploader";
import { Exam } from "@/types";

export default function AdminDashboardPage() {
  const [data, setData] = useState<{ stats: any; recentAttempts: any[] } | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedExamId, setCopiedExamId] = useState<string | null>(null);

  // Quick Upload Modal State
  const [selectedUploadExamId, setSelectedUploadExamId] = useState<string | null>(null);

  // 1-Step Quick Exam Creator Modal State
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickSubject, setQuickSubject] = useState("");
  const [quickDuration, setQuickDuration] = useState(30);
  const [quickFile, setQuickFile] = useState<File | null>(null);
  const [quickCreating, setQuickCreating] = useState(false);
  const [quickSuccessMsg, setQuickSuccessMsg] = useState("");
  const [quickErrorMsg, setQuickErrorMsg] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, examsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/exams"),
      ]);

      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setData(statsJson);
      }
      if (examsRes.ok) {
        const examsJson = await examsRes.json();
        setExams(examsJson.exams || []);
      }
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Dynamic polling every 5 seconds for real-time exam monitoring
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleCopyLink = (examId: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const testUrl = `${origin}/student/register?examId=${examId}`;
    navigator.clipboard.writeText(testUrl);
    setCopiedExamId(examId);
    setTimeout(() => setCopiedExamId(null), 2500);
  };

  const handleQuickCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickErrorMsg("");
    setQuickSuccessMsg("");

    if (!quickTitle.trim() || !quickSubject.trim()) {
      setQuickErrorMsg("Please provide both Exam Title and Subject.");
      return;
    }

    setQuickCreating(true);

    try {
      const formData = new FormData();
      formData.append("title", quickTitle.trim());
      formData.append("subject", quickSubject.trim());
      formData.append("durationMinutes", String(quickDuration));
      formData.append("status", "active");
      formData.append("shuffleQuestions", "true");
      formData.append("shuffleOptions", "true");
      if (quickFile) {
        formData.append("file", quickFile);
      }

      const res = await fetch("/api/admin/exams", {
        method: "POST",
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to create exam.");
      }

      setQuickSuccessMsg(
        `Exam "${resData.exam.title}" created with ${resData.importedCount || 0} questions! It is now live for all students.`
      );
      setQuickTitle("");
      setQuickSubject("");
      setQuickFile(null);
      fetchData();

      setTimeout(() => {
        setShowQuickCreateModal(false);
        setQuickSuccessMsg("");
      }, 2000);
    } catch (err: any) {
      setQuickErrorMsg(err.message || "An error occurred.");
    } finally {
      setQuickCreating(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-slate-200/60 animate-pulse rounded-3xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-slate-200/60 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalExams: 0,
    totalStudents: 0,
    totalAttempts: 0,
    completedTests: 0,
    averageScore: 0,
    highestScore: 0,
  };

  const statCards = [
    { title: "Total Exams", value: stats.totalExams, icon: FileSpreadsheet, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Total Students", value: stats.totalStudents, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Total Attempts", value: stats.totalAttempts, icon: Clock, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Completed Tests", value: stats.completedTests, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Average Score", value: `${stats.averageScore}%`, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Highest Marks", value: stats.highestScore, icon: Award, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner with Dynamic Live Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Examination Control Dashboard</h1>
            {data?.stats?.isCloudConnected !== false ? (
              <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Cloud Storage Active</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Serverless Memory Mode</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Upload PDF/Excel question papers to instantly generate dynamic examinations for all students.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowQuickCreateModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition transform active:scale-95"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Question Paper & Launch</span>
          </button>
          <Link
            href="/admin/export"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Link>
        </div>
      </div>

      {/* Cloud Persistence Guide Banner if not connected */}
      {data?.stats?.isCloudConnected === false && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 font-bold text-amber-900">
              <span>⚠️ Permanent Storage Configuration (Recommended for Vercel)</span>
            </div>
            <span className="text-[11px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-bold">1-Click Free Setup</span>
          </div>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            To ensure tests and student responses are preserved permanently across all Vercel serverless containers:
            Go to your <strong>Vercel Dashboard</strong> → <strong>Storage</strong> tab → Click <strong>Create Upstash Redis</strong> → Connect it to this project (or add <code>UPSTASH_REDIS_REST_URL</code> & <code>UPSTASH_REDIS_REST_TOKEN</code> in Environment Variables).
          </p>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{card.title}</span>
                <div className={`w-7 h-7 rounded-lg ${card.bg} ${card.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Active Examinations with Fast Question Upload & Student Link Sharing */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Live Examinations & Student Links</h3>
            <p className="text-xs text-slate-500">
              Questions uploaded here are immediately delivered to all participating students
            </p>
          </div>
          <button
            onClick={() => setShowQuickCreateModal(true)}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>New Exam with File</span>
          </button>
        </div>

        {exams.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No exams created yet. Click "Upload Question Paper & Launch" above to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => {
              const isCopied = copiedExamId === exam.id;
              return (
                <div
                  key={exam.id}
                  className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                        {exam.subject}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{exam.durationMinutes}m</span>
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{exam.title}</h4>
                    <p className="text-xs text-slate-500 flex items-center space-x-2">
                      <span className="font-semibold text-slate-800">{exam.totalQuestions} Questions</span>
                      <span>•</span>
                      <span>{exam.marksPerQuestion} Mark/Q</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
                    {/* Upload / Manage Questions */}
                    <button
                      onClick={() => setSelectedUploadExamId(exam.id)}
                      className="flex-1 inline-flex items-center justify-center space-x-1 py-1.5 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Questions</span>
                    </button>

                    {/* Copy Student Test Link */}
                    <button
                      onClick={() => handleCopyLink(exam.id)}
                      title="Copy Student Test Link"
                      className={`inline-flex items-center space-x-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition border ${
                        isCopied
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{isCopied ? "Copied!" : "Share Link"}</span>
                    </button>

                    <Link
                      href={`/admin/exams/${exam.id}/questions`}
                      title="Inspect Questions"
                      className="p-1.5 bg-white text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Submissions and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Attempts Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Live Student Submissions Stream</h3>
                <p className="text-xs text-slate-500">Auto-refreshing live server results</p>
              </div>
              <Link
                href="/admin/students"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <span>View All Students</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Roll / Div</th>
                    <th className="px-4 py-3">Exam</th>
                    <th className="px-4 py-3">Marks</th>
                    <th className="px-4 py-3">Score %</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.recentAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No submissions recorded yet. Take an exam as a student to see live results stream here!
                      </td>
                    </tr>
                  ) : (
                    data?.recentAttempts.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3.5 font-bold text-slate-900">{att.studentName}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">
                          {att.rollNumber} / {att.division}
                        </td>
                        <td className="px-4 py-3 text-slate-700 max-w-[150px] truncate">{att.examTitle}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {att.marksObtained} / {att.totalPossibleMarks}
                        </td>
                        <td className="px-4 py-3">
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
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/students/${att.id}`}
                            className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg transition"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 text-right">
            Confidential Result Stream • Updates Automatically
          </div>
        </div>

        {/* Quick Operations Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Quick Test Workflows</h3>

            <div className="space-y-2.5">
              <button
                onClick={() => setShowQuickCreateModal(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 text-xs font-bold text-blue-900 transition text-left"
              >
                <span className="flex items-center space-x-2">
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  <span>1-Click Upload PDF/Excel & Launch</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
              </button>

              <Link
                href="/admin/students"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-xs font-semibold text-slate-700 transition"
              >
                <span>👥 Audit Individual Student Responses</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                href="/admin/export"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-xs font-semibold text-slate-700 transition"
              >
                <span>📊 Download Full Results Spreadsheet</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-tr from-slate-900 to-indigo-950 rounded-3xl text-white shadow-lg space-y-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h4 className="text-sm font-bold">Dynamic Question Distribution</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When you upload a question file (PDF, Excel, CSV, JSON), the questions become immediately available for all students taking the test. The server randomizes the sequence and options separately for each candidate.
            </p>
          </div>
        </div>
      </div>

      {/* 1-Step Quick Exam Creator & File Uploader Modal */}
      <Modal
        isOpen={showQuickCreateModal}
        onClose={() => setShowQuickCreateModal(false)}
        title="Upload Question Paper & Launch Examination"
        maxWidth="2xl"
      >
        <form onSubmit={handleQuickCreateSubmit} className="space-y-4">
          {quickSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{quickSuccessMsg}</span>
            </div>
          )}

          {quickErrorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold">
              {quickErrorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Examination Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Physics Quiz 2026"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Subject *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Physics"
                value={quickSubject}
                onChange={(e) => setQuickSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Duration (Minutes)
            </label>
            <input
              type="number"
              min={1}
              max={300}
              value={quickDuration}
              onChange={(e) => setQuickDuration(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
            />
          </div>

          {/* File Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Attach Question Paper (PDF, Excel, CSV, or JSON)
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-5 text-center bg-slate-50/50 cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.json,.txt"
                onChange={(e) => {
                  if (e.target.files?.[0]) setQuickFile(e.target.files[0]);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center">
                <UploadCloud className="w-8 h-8 text-blue-600 mb-1" />
                {quickFile ? (
                  <p className="text-xs font-bold text-slate-900">{quickFile.name} (Ready to import)</p>
                ) : (
                  <p className="text-xs text-slate-600 font-medium">
                    Click or drag & drop <strong>PDF</strong>, <strong>Excel</strong>, <strong>CSV</strong>, or <strong>JSON</strong> file
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowQuickCreateModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={quickCreating}
              className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-50"
            >
              {quickCreating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{quickCreating ? "Creating & Importing Questions..." : "Create & Launch Exam Now"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Upload Questions to Existing Exam Modal */}
      {selectedUploadExamId && (
        <Modal
          isOpen={Boolean(selectedUploadExamId)}
          onClose={() => setSelectedUploadExamId(null)}
          title="Upload Questions (PDF / Excel / CSV / JSON)"
          maxWidth="4xl"
        >
          <QuestionUploader
            examId={selectedUploadExamId}
            onImportComplete={() => {
              setSelectedUploadExamId(null);
              fetchData();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
