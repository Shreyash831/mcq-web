"use client";

import React from "react";
import { Flag, Check, Circle } from "lucide-react";
import { SanitizedQuestion } from "@/types";

interface QuestionPaletteProps {
  questions: SanitizedQuestion[];
  currentIndex: number;
  visitedIndices: Set<number>;
  onSelectQuestion: (index: number) => void;
}

export default function QuestionPalette({
  questions,
  currentIndex,
  visitedIndices,
  onSelectQuestion,
}: QuestionPaletteProps) {
  const answeredCount = questions.filter((q) => Boolean(q.selectedAnswer)).length;
  const flaggedCount = questions.filter((q) => Boolean(q.isFlagged)).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800">Question Palette</h3>
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
          {answeredCount} / {questions.length} Answered
        </span>
      </div>

      {/* Status Legends */}
      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 flex items-center justify-center text-white text-[9px]">
            <Check className="w-2.5 h-2.5" />
          </span>
          <span>Answered ({answeredCount})</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-amber-400 flex items-center justify-center text-white text-[9px]">
            <Flag className="w-2.5 h-2.5" />
          </span>
          <span>Flagged ({flaggedCount})</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-slate-200 flex items-center justify-center text-slate-500"></span>
          <span>Not Answered</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded-md border-2 border-blue-600 bg-blue-50"></span>
          <span>Current</span>
        </div>
      </div>

      {/* Palette Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = Boolean(q.selectedAnswer);
          const isFlagged = Boolean(q.isFlagged);
          const isVisited = visitedIndices.has(idx);

          let bgClass = "bg-slate-100 text-slate-600 hover:bg-slate-200";
          if (isAnswered) {
            bgClass = "bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm";
          } else if (isVisited) {
            bgClass = "bg-rose-100 text-rose-700 font-medium hover:bg-rose-200 border border-rose-200";
          }

          return (
            <button
              key={q.id}
              onClick={() => onSelectQuestion(idx)}
              className={`relative h-10 w-full rounded-xl flex items-center justify-center text-xs font-semibold transition-all ${bgClass} ${
                isCurrent ? "ring-2 ring-blue-600 ring-offset-2 scale-105 font-bold z-10" : ""
              }`}
            >
              <span>{idx + 1}</span>
              {isFlagged && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center shadow-xs">
                  <Flag className="w-2 h-2 text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
