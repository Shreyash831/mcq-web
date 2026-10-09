"use client";

import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface ExamTimerProps {
  expiresAt: string;
  onTimeExpired: () => void;
}

export default function ExamTimer({ expiresAt, onTimeExpired }: ExamTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const target = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((target - now) / 1000));
      setSecondsLeft(diff);

      if (diff === 0) {
        onTimeExpired();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onTimeExpired]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft > 0 && secondsLeft <= 120; // Last 2 minutes

  return (
    <div
      className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border transition-all ${
        isUrgent
          ? "bg-red-500/10 border-red-500 text-red-600 animate-pulse font-bold"
          : "bg-slate-100/90 border-slate-200 text-slate-800 font-semibold"
      }`}
    >
      {isUrgent ? (
        <AlertTriangle className="w-4 h-4 text-red-600 animate-bounce" />
      ) : (
        <Clock className="w-4 h-4 text-slate-500" />
      )}
      <div className="flex flex-col text-left">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Time Remaining</span>
        <span className="font-mono text-base tracking-wide leading-none">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
