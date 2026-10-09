"use client";

import React, { useEffect, useState } from "react";
import { Download, FileSpreadsheet, CheckCircle2, FileText, ArrowRight } from "lucide-react";
import { Exam } from "@/types";

export default function ExportPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/exams")
      .then((res) => res.json())
      .then((d) => {
        if (d.exams) setExams(d.exams);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadResults = () => {
    const url = `/api/admin/export${selectedExamId ? `?examId=${selectedExamId}` : ""}`;
    window.open(url, "_blank");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Export Examination Results</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Generate and download institutional grading spreadsheets compatible with Excel, Google Sheets, and SIS systems.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Results Export Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Student Performance Spreadsheet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export student names, roll numbers, divisions, calculated scores, percentage, correct/incorrect breakdowns, and submission timestamps.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Filter by Examination
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
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

          <button
            onClick={handleDownloadResults}
            className="w-full inline-flex items-center justify-center space-x-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Results (CSV)</span>
          </button>
        </div>

        {/* Question Template Downloads Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Question Import Templates</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Download standard blank question upload templates formatted with required headers: Question, Option A, Option B, Option C, Option D, Correct Answer.
            </p>

            <div className="space-y-2 pt-2">
              <a
                href="/api/admin/exams/sample/template?format=csv"
                download="mcq_question_template.csv"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-xs font-semibold text-slate-700 transition"
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
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-xs font-semibold text-slate-700 transition"
              >
                <span className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Download Sample JSON Template</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
