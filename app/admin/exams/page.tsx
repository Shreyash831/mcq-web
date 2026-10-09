"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Plus,
  Clock,
  HelpCircle,
  Play,
  Pause,
  Trash2,
  UploadCloud,
  Users,
  Settings,
  AlertCircle,
  Shuffle,
  Copy,
  Check,
  Eye,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import QuestionUploader from "@/components/admin/QuestionUploader";
import { Exam } from "@/types";

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUploadExamId, setSelectedUploadExamId] = useState<string | null>(null);
  const [copiedExamId, setCopiedExamId] = useState<string | null>(null);

  const fetchExams = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/exams");
      if (res.ok) {
        const data = await res.json();
        setExams(data.exams);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
    const interval = setInterval(fetchExams, 5000);
    return () => clearInterval(interval);
  }, [fetchExams]);

  const handleToggleStatus = async (exam: Exam) => {
    const newStatus = exam.status === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`/api/admin/exams/${exam.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setExams((prev) => prev.map((e) => (e.id === exam.id ? { ...e, status: newStatus } : e)));
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleDeleteExam = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? All associated questions and student attempts will also be deleted.`)) return;

    try {
      const res = await fetch(`/api/admin/exams/${id}`, { method: "DELETE" });
      if (res.ok) {
        setExams((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete exam", err);
    }
  };

  const handleCopyLink = (examId: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const testUrl = `${origin}/student/register?examId=${examId}`;
    navigator.clipboard.writeText(testUrl);
    setCopiedExamId(examId);
    setTimeout(() => setCopiedExamId(null), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Examinations Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Upload question files (PDF / Excel / CSV), configure timing, and share direct test links with students.
          </p>
        </div>

        <Link
          href="/admin/exams/new"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Exam</span>
        </Link>
      </div>

      {loading && exams.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-200/60 animate-pulse rounded-3xl"></div>
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Examinations Created Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Get started by creating your first examination and uploading questions from PDF, CSV, or Excel.
          </p>
          <Link
            href="/admin/exams/new"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Exam</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => {
            const isActive = exam.status === "active";
            const isCopied = copiedExamId === exam.id;

            return (
              <div
                key={exam.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                      {exam.subject}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(exam)}
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold transition ${
                        isActive
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {isActive ? <Play className="w-3 h-3 fill-emerald-600 text-emerald-600" /> : <Pause className="w-3 h-3 text-slate-500" />}
                      <span>{isActive ? "Active (Live)" : "Inactive"}</span>
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{exam.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{exam.description || "No description provided."}</p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.durationMinutes} Minutes</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-900">{exam.totalQuestions} Questions</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-slate-800">Marks/Q:</span>
                      <span>{exam.marksPerQuestion}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Shuffle className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.shuffleQuestions ? "Shuffled" : "Sequential"}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedUploadExamId(exam.id)}
                      className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload PDF/Excel</span>
                    </button>

                    <button
                      onClick={() => handleCopyLink(exam.id)}
                      className={`inline-flex items-center space-x-1 py-2 px-3 rounded-xl text-xs font-bold transition border ${
                        isCopied
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
                      }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? "Link Copied!" : "Share Link"}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Link
                      href={`/admin/exams/${exam.id}/questions`}
                      className="flex-1 text-center py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition"
                    >
                      View Question Bank ({exam.totalQuestions})
                    </Link>

                    <Link
                      href={`/admin/students?examId=${exam.id}`}
                      title="View Student Results"
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition border border-slate-200"
                    >
                      <Users className="w-4 h-4" />
                    </Link>

                    <Link
                      href={`/admin/exams/${exam.id}`}
                      title="Settings"
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition border border-slate-200"
                    >
                      <Settings className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleDeleteExam(exam.id, exam.title)}
                      title="Delete Exam"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition border border-slate-200 hover:border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Questions Modal */}
      {selectedUploadExamId && (
        <Modal
          isOpen={Boolean(selectedUploadExamId)}
          onClose={() => setSelectedUploadExamId(null)}
          title="Upload Question Paper (PDF / Excel / CSV / JSON)"
          maxWidth="4xl"
        >
          <QuestionUploader
            examId={selectedUploadExamId}
            onImportComplete={() => {
              setSelectedUploadExamId(null);
              fetchExams();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
