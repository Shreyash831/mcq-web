"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  UploadCloud,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  HelpCircle,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import QuestionUploader from "@/components/admin/QuestionUploader";
import { Exam, Question, OptionKey } from "@/types";

export default function ExamQuestionsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);

  const [newQ, setNewQ] = useState({
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A" as OptionKey,
  });

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/exams/${id}/questions`);
      if (res.ok) {
        const data = await res.json();
        setExam(data.exam);
        setQuestions(data.questions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);

    try {
      const res = await fetch(`/api/admin/exams/${id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQ),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewQ({
          questionText: "",
          optionA: "",
          optionB: "",
          optionC: "",
          optionD: "",
          correctAnswer: "A",
        });
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm(`Are you sure you want to clear all ${questions.length} questions for this exam?`)) return;

    try {
      const res = await fetch(`/api/admin/exams/${id}/questions`, { method: "DELETE" });
      if (res.ok) {
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading questions repository...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/exams"
            className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {exam?.subject}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {exam?.title}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Managing <span className="font-bold text-slate-900">{questions.length} Questions</span> in Question Bank
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload PDF / Excel / CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Question</span>
          </button>

          {questions.length > 0 && (
            <button
              onClick={handleClearAll}
              title="Delete all questions"
              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Questions Listing */}
      {questions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Questions in Question Bank</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Upload questions using our spreadsheet template (CSV/XLSX/JSON) or add questions manually.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Question File</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-sm font-bold text-slate-900 leading-relaxed">{q.questionText}</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg flex items-center space-x-1 flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Correct: {q.correctAnswer}</span>
                </span>
              </div>

              {/* Options 2x2 Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 pl-10 text-xs">
                {(["A", "B", "C", "D"] as OptionKey[]).map((optKey) => {
                  const optText =
                    optKey === "A"
                      ? q.optionA
                      : optKey === "B"
                      ? q.optionB
                      : optKey === "C"
                      ? q.optionC
                      : q.optionD;
                  const isCorrect = q.correctAnswer === optKey;

                  return (
                    <div
                      key={optKey}
                      className={`p-3 rounded-xl border flex items-center space-x-2.5 ${
                        isCorrect
                          ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                          isCorrect ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200"
                        }`}
                      >
                        {optKey}
                      </span>
                      <span className="truncate">{optText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload File Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload & Import Questions (PDF / Excel / CSV / JSON)"
        maxWidth="4xl"
      >
        <QuestionUploader
          examId={id}
          onImportComplete={() => {
            setShowUploadModal(false);
            fetchQuestions();
          }}
        />
      </Modal>

      {/* Add Single Question Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Single Question Manually"
        maxWidth="2xl"
      >
        <form onSubmit={handleAddQuestion} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Question Text *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. What is the value of 2 + 2?"
              value={newQ.questionText}
              onChange={(e) => setNewQ({ ...newQ, questionText: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Option A *</label>
              <input
                type="text"
                required
                value={newQ.optionA}
                onChange={(e) => setNewQ({ ...newQ, optionA: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Option B *</label>
              <input
                type="text"
                required
                value={newQ.optionB}
                onChange={(e) => setNewQ({ ...newQ, optionB: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Option C *</label>
              <input
                type="text"
                required
                value={newQ.optionC}
                onChange={(e) => setNewQ({ ...newQ, optionC: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Option D *</label>
              <input
                type="text"
                required
                value={newQ.optionD}
                onChange={(e) => setNewQ({ ...newQ, optionD: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Correct Answer *
            </label>
            <select
              value={newQ.correctAnswer}
              onChange={(e) => setNewQ({ ...newQ, correctAnswer: e.target.value as OptionKey })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            >
              <option value="A">Option A</option>
              <option value="B">Option B</option>
              <option value="C">Option C</option>
              <option value="D">Option D</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition"
            >
              {adding ? "Saving..." : "Save Question"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
