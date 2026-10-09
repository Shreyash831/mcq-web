"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Sparkles, Shuffle, UploadCloud, CheckCircle2 } from "lucide-react";

export default function NewExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    description: "",
    durationMinutes: 30,
    marksPerQuestion: 1,
    negativeMarks: 0,
    shuffleQuestions: true,
    shuffleOptions: true,
    status: "active" as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.title.trim() || !formData.subject.trim() || !formData.durationMinutes) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      if (attachedFile) {
        // Send as FormData with file
        const fd = new FormData();
        fd.append("title", formData.title.trim());
        fd.append("subject", formData.subject.trim());
        fd.append("description", formData.description.trim());
        fd.append("durationMinutes", String(formData.durationMinutes));
        fd.append("marksPerQuestion", String(formData.marksPerQuestion));
        fd.append("negativeMarks", String(formData.negativeMarks));
        fd.append("shuffleQuestions", String(formData.shuffleQuestions));
        fd.append("shuffleOptions", String(formData.shuffleOptions));
        fd.append("status", formData.status);
        fd.append("file", attachedFile);

        const res = await fetch("/api/admin/exams", {
          method: "POST",
          body: fd,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create examination.");

        router.push(`/admin/exams/${data.exam.id}/questions`);
        return;
      }

      // Plain JSON
      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create examination.");
      }

      router.push(`/admin/exams/${data.exam.id}/questions`);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <Link
          href="/admin/exams"
          className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create New Examination</h1>
          <p className="text-xs text-slate-500">Configure parameters and optionally attach a question file directly</p>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Examination Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mathematics Mid-Term 2026"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Subject / Topic *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mathematics"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Optional Attach Question Paper */}
          <div className="p-5 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                Attach Question Paper (Optional - Can also upload later)
              </h4>
            </div>

            <div className="border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl p-5 text-center bg-white cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.json,.txt"
                onChange={(e) => {
                  if (e.target.files?.[0]) setAttachedFile(e.target.files[0]);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center">
                <UploadCloud className="w-7 h-7 text-blue-600 mb-1" />
                {attachedFile ? (
                  <p className="text-xs font-bold text-blue-900">{attachedFile.name} (Ready for automatic import)</p>
                ) : (
                  <p className="text-xs text-slate-600 font-medium">
                    Drop your <strong>PDF</strong>, <strong>Excel (.xlsx)</strong>, <strong>CSV</strong>, or <strong>JSON</strong> file here
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Description / Instructions
            </label>
            <textarea
              rows={3}
              placeholder="Instructions shown to students before starting..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Duration, Marks, Negative */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Duration (Minutes) *
              </label>
              <input
                type="number"
                min={1}
                max={300}
                required
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Marks Per Question *
              </label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                required
                value={formData.marksPerQuestion}
                onChange={(e) => setFormData({ ...formData, marksPerQuestion: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Negative Marks per Incorrect
              </label>
              <input
                type="number"
                min={0}
                step={0.25}
                value={formData.negativeMarks}
                onChange={(e) => setFormData({ ...formData, negativeMarks: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-semibold"
              />
            </div>
          </div>

          {/* Randomization & Anti-Cheating Toggles */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <Shuffle className="w-4 h-4 text-blue-600" />
              <span>Anti-Cheating & Randomization Policies</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start space-x-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 transition">
                <input
                  type="checkbox"
                  checked={formData.shuffleQuestions}
                  onChange={(e) => setFormData({ ...formData, shuffleQuestions: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Shuffle Question Order</span>
                  <span className="text-[11px] text-slate-500">Every candidate receives questions in a distinct randomized sequence.</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 transition">
                <input
                  type="checkbox"
                  checked={formData.shuffleOptions}
                  onChange={(e) => setFormData({ ...formData, shuffleOptions: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Shuffle Answer Options</span>
                  <span className="text-[11px] text-slate-500">Options (A, B, C, D) are shuffled differently for each student.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Initial Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="active">Active (Available for students immediately)</option>
              <option value="inactive">Inactive / Draft (Hidden from students)</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Link
              href="/admin/exams"
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? "Creating & Uploading..." : "Save Exam & Launch →"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
