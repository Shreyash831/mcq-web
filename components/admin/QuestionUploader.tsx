"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  RefreshCw,
  Eye,
  FileText,
  FileCode,
  File,
} from "lucide-react";
import { ParseResult } from "@/lib/excel";

interface QuestionUploaderProps {
  examId: string;
  onImportComplete: () => void;
}

export default function QuestionUploader({ examId, onImportComplete }: QuestionUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<ParseResult | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selected: File) => {
    setFile(selected);
    setValidationResult(null);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleValidate = async () => {
    if (!file) {
      setErrorMsg("Please select a question file first.");
      return;
    }

    setIsValidating(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("confirm", "false");

      const res = await fetch(`/api/admin/exams/${examId}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to validate question file.");
      }

      setValidationResult(data.validation);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during file parsing and validation.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("confirm", "true");
      formData.append("replaceExisting", String(replaceExisting));

      const res = await fetch(`/api/admin/exams/${examId}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import questions.");
      }

      setSuccessMsg(`✅ Successfully imported ${data.importedCount} questions! They are now live in the exam for all students.`);
      setFile(null);
      setValidationResult(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Allow user to see the success message before auto-closing
      setTimeout(() => {
        onImportComplete();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete import.");
    } finally {
      setIsImporting(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".pdf")) return <FileText className="w-8 h-8 text-rose-600" />;
    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv"))
      return <FileSpreadsheet className="w-8 h-8 text-emerald-600" />;
    if (fileName.endsWith(".json")) return <FileCode className="w-8 h-8 text-amber-600" />;
    return <File className="w-8 h-8 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Formats Supported & Template Helper */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white rounded-xl shadow-xs text-blue-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Supported Question Formats: PDF, Excel, CSV & JSON</h4>
              <p className="text-xs text-slate-600">
                Upload your question paper as a <strong>PDF Document</strong>, <strong>Excel spreadsheet (.xlsx)</strong>, <strong>CSV</strong>, or <strong>JSON</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={`/api/admin/exams/${examId}/template?format=csv`}
              download="question_template.csv"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 shadow-xs transition"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Sample CSV</span>
            </a>
            <a
              href={`/api/admin/exams/${examId}/template?format=json`}
              download="question_template.json"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 shadow-xs transition"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Sample JSON</span>
            </a>
          </div>
        </div>

        {/* Format Guidelines Box */}
        <div className="pt-2 border-t border-blue-200/60 text-[11px] text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100">
            <span className="font-bold text-rose-700 block mb-0.5">📄 PDF Question Paper Format:</span>
            <span>1. What is the capital of France? A) London B) Berlin C) Paris D) Madrid Answer: C</span>
          </div>
          <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100">
            <span className="font-bold text-emerald-700 block mb-0.5">📊 Excel / CSV Columns:</span>
            <span>Question | Option A | Option B | Option C | Option D | Correct Answer (A/B/C/D)</span>
          </div>
        </div>
      </div>

      {/* File Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
        }}
        className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
          file
            ? "border-blue-500 bg-blue-50/20"
            : "border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.xlsx,.xls,.csv,.json,.txt"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 shadow-inner">
            {file ? getFileIcon(file.name) : <UploadCloud className="w-8 h-8 text-blue-600" />}
          </div>
          {file ? (
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB • Ready for verification</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">Drag & drop your PDF, Excel, CSV, or JSON question file here</p>
              <p className="text-xs text-slate-400">Click anywhere to browse files from your computer</p>
            </div>
          )}
        </div>
      </div>

      {/* Validate Button */}
      {file && !validationResult && (
        <div className="flex justify-end">
          <button
            onClick={handleValidate}
            disabled={isValidating}
            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-50"
          >
            {isValidating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            <span>{isValidating ? "Parsing & Validating Questions..." : "Parse & Preview Questions"}</span>
          </button>
        </div>
      )}

      {/* Alerts */}
      {errorMsg && (
        <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
          <div>
            <p className="font-bold">Parsing / Validation Issue</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center space-x-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Validation Result Box */}
      {validationResult && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-2xl">
            <div>
              <h4 className="text-sm font-bold flex items-center space-x-2">
                <span>Extracted Questions Summary</span>
                {validationResult.validCount > 0 ? (
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full border border-emerald-400/30">
                    {validationResult.validCount} Valid Questions Found
                  </span>
                ) : (
                  <span className="bg-rose-500/20 text-rose-300 text-xs px-2 py-0.5 rounded-full border border-rose-400/30">
                    0 Valid Questions
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Total Extracted: <span className="font-semibold text-white">{validationResult.totalRows}</span> | Ready to Import:{" "}
                <span className="font-semibold text-emerald-400">{validationResult.validCount}</span> | Issues:{" "}
                <span className="font-semibold text-rose-400">{validationResult.invalidCount}</span>
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span>Replace existing exam questions</span>
              </label>

              <button
                onClick={handleConfirmImport}
                disabled={isImporting || validationResult.validCount === 0}
                className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
              >
                {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Import {validationResult.validCount} Questions to Exam</span>
              </button>
            </div>
          </div>

          {/* Validation Errors List if any */}
          {validationResult.errorsSummary.length > 0 && (
            <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-2">
              <p className="text-xs font-bold text-rose-800 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Found {validationResult.errorsSummary.length} Item Warnings:</span>
              </p>
              <ul className="text-xs text-rose-700 list-disc list-inside space-y-1 max-h-40 overflow-y-auto pl-1">
                {validationResult.errorsSummary.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Table Preview */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Preview Parsed Questions</span>
              <span className="text-xs text-slate-500">Showing top {Math.min(validationResult.rows.length, 10)} rows</span>
            </div>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Question Text</th>
                    <th className="px-3 py-2">Option A</th>
                    <th className="px-3 py-2">Option B</th>
                    <th className="px-3 py-2">Option C</th>
                    <th className="px-3 py-2">Option D</th>
                    <th className="px-3 py-2">Answer</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validationResult.rows.map((row, idx) => (
                    <tr key={idx} className={row.errors.length > 0 ? "bg-rose-50/40" : "hover:bg-slate-50"}>
                      <td className="px-3 py-2 font-mono text-slate-400">{row.rowNumber}</td>
                      <td className="px-3 py-2 font-medium text-slate-900 max-w-xs truncate" title={row.questionText}>
                        {row.questionText || <span className="text-rose-500 italic">Missing</span>}
                      </td>
                      <td className="px-3 py-2">{row.optionA || <span className="text-rose-500">Empty</span>}</td>
                      <td className="px-3 py-2">{row.optionB || <span className="text-rose-500">Empty</span>}</td>
                      <td className="px-3 py-2">{row.optionC || <span className="text-rose-500">Empty</span>}</td>
                      <td className="px-3 py-2">{row.optionD || <span className="text-rose-500">Empty</span>}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                          {row.correctAnswer || "?"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {row.errors.length === 0 ? (
                          <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Valid</span>
                          </span>
                        ) : (
                          <span className="text-rose-600 font-semibold">Invalid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
