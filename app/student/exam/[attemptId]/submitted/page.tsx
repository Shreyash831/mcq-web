"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Home } from "lucide-react";

export default function SubmittedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Submission Completed</h2>
          <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 py-2 px-4 rounded-xl border border-emerald-200">
            Your examination has been submitted successfully.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 space-y-2 text-left">
          <div className="flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <p>
              Your responses have been securely transferred and recorded into the institutional grading database.
            </p>
          </div>
          <p className="text-slate-400 text-[11px] pt-1">
            * In accordance with examination regulations, marks and question keys are confidential and released only by your course administrator.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center space-x-2 py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            <Home className="w-4 h-4" />
            <span>Return to Main Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
