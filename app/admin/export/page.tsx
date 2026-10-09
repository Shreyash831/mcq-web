"use client";

import React, { useEffect, useState, useRef } from "react";
import { Download, FileSpreadsheet, CheckCircle2, FileText, ArrowRight, Database, UploadCloud, RefreshCw, File } from "lucide-react";
import { Exam } from "@/types";

export default function ExportPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState("");
  const [restoreError, setRestoreError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/exams")
      .then((res) => res.json())
      .then((d) => {
        if (d.exams) setExams(d.exams);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadExcel = () => {
    const url = `/api/admin/export?format=xlsx${selectedExamId ? `&examId=${selectedExamId}` : ""}`;
    window.open(url, "_blank");
  };

  const handleDownloadCsv = () => {
    const url = `/api/admin/export?format=csv${selectedExamId ? `&examId=${selectedExamId}` : ""}`;
    window.open(url, "_blank");
  };

  const handleDownloadDbJson = () => {
    window.open("/api/admin/db-backup", "_blank");
  };

  const handleRestoreDb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoring(true);
    setRestoreMsg("");
    setRestoreError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/db-backup", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to restore database");

      setRestoreMsg(data.message || "Database restored successfully!");
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Refresh exams
      const examRes = await fetch("/api/admin/exams");
      if (examRes.ok) {
        const d = await examRes.json();
        if (d.exams) setExams(d.exams);
      }
    } catch (err: any) {
      setRestoreError(err.message || "Failed to restore database file.");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Export Student Examination Results</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Download formatted Excel spreadsheets (.xlsx) and CSV files for all student candidates, marks, and grades.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Results Export Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Student Results Excel File (.xlsx)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export student names, roll numbers, divisions, calculated scores, percentage, correct/incorrect breakdowns, and submission timestamps directly into Microsoft Excel.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Filter by Examination
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Examinations (Consolidated Export)</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} ({ex.subject})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleDownloadExcel}
              className="w-full inline-flex items-center justify-center space-x-2 py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition transform active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel File (.xlsx)</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Plain CSV</span>
            </button>
          </div>
        </div>

        {/* Question Template Downloads Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Question Import Templates</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Download standard blank question upload templates formatted with required headers: Question, Option A, Option B, Option C, Option D, Correct Answer.
            </p>

            <div className="space-y-2 pt-2">
              <a
                href="/api/admin/exams/sample/template?format=csv"
                download="mcq_question_template.csv"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-xs font-semibold text-slate-700 transition"
              >
                <span className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Download Sample CSV Template</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <a
                href="/api/admin/exams/sample/template?format=json"
                download="mcq_question_template.json"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-xs font-semibold text-slate-700 transition"
              >
                <span className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Download Sample JSON Template</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Full Database Backup & GitHub Sync Card */}
        <div className="md:col-span-2 bg-gradient-to-tr from-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Database className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-bold">GitHub Repository Database Sync (`data/exam_system.json`)</h3>
              </div>
              <p className="text-xs text-slate-300 max-w-xl">
                Download the complete JSON database file containing all exams, questions, and students to commit it directly into your GitHub repository for permanent offline and production deployments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownloadDbJson}
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                <Download className="w-4 h-4" />
                <span>Download `exam_system.json`</span>
              </button>

              <label className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl cursor-pointer transition">
                {restoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                <span>{restoring ? "Restoring..." : "Restore from JSON File"}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleRestoreDb}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {restoreMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{restoreMsg}</span>
            </div>
          )}

          {restoreError && (
            <div className="p-3 bg-rose-500/20 border border-rose-400/40 rounded-xl text-rose-300 text-xs font-bold">
              {restoreError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
