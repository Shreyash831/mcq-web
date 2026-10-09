"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, UploadCloud, Trash2, Shuffle, CheckCircle2 } from "lucide-react";
import { Exam } from "@/types";

export default function EditExamPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchExam = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/exams/${id}`);
      if (res.ok) {
        const data = await res.json();
        setExam(data.exam);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExam();
  }, [fetchExam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exam) return;

    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/admin/exams/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exam),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update exam");

      setSuccessMsg("Examination settings updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !exam) {
    return <div className="p-8 text-center text-slate-500">Loading examination details...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/exams"
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Edit Examination Settings</h1>
            <p className="text-xs text-slate-500">Modify time limits, scoring metrics, and randomization rules</p>
          </div>
        </div>

        <Link
          href={`/admin/exams/${id}/questions`}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-xl transition"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Manage Questions ({exam.totalQuestions})</span>
        </Link>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Title</label>
              <input
                type="text"
                required
                value={exam.title}
                onChange={(e) => setExam({ ...exam, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Subject</label>
              <input
                type="text"
                required
                value={exam.subject}
                onChange={(e) => setExam({ ...exam, subject: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Description</label>
            <textarea
              rows={3}
              value={exam.description}
              onChange={(e) => setExam({ ...exam, description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Duration (Mins)</label>
              <input
                type="number"
                min={1}
                value={exam.durationMinutes}
                onChange={(e) => setExam({ ...exam, durationMinutes: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Marks / Q</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={exam.marksPerQuestion}
                onChange={(e) => setExam({ ...exam, marksPerQuestion: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Negative Marks</label>
              <input
                type="number"
                min={0}
                step={0.25}
                value={exam.negativeMarks}
                onChange={(e) => setExam({ ...exam, negativeMarks: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
              />
            </div>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <Shuffle className="w-4 h-4 text-blue-600" />
              <span>Randomization Settings</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={exam.shuffleQuestions}
                  onChange={(e) => setExam({ ...exam, shuffleQuestions: e.target.checked })}
                  className="rounded text-blue-600 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-800">Shuffle Questions for Each Student</span>
              </label>
              <label className="flex items-center space-x-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={exam.shuffleOptions}
                  onChange={(e) => setExam({ ...exam, shuffleOptions: e.target.checked })}
                  className="rounded text-blue-600 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-800">Shuffle Options (A, B, C, D)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Status</label>
            <select
              value={exam.status}
              onChange={(e) => setExam({ ...exam, status: e.target.value as any })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
            >
              <option value="active">Active (Available for students)</option>
              <option value="inactive">Inactive (Disabled)</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
