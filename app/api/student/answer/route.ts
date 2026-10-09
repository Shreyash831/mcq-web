import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudentSession } from "@/lib/auth";
import { isAttemptExpired, resolveNormalizedOption } from "@/lib/exam-engine";
import { OptionKey } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const session = await getStudentSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    const { attemptId, questionId, selectedAnswer, isFlagged } = await req.json();

    if (!attemptId || !questionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (session.attemptId !== attemptId) {
      return NextResponse.json({ error: "Unauthorized attempt access" }, { status: 403 });
    }

    const attempt = db.attempts.findById(attemptId);
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.status !== "in_progress") {
      return NextResponse.json({ error: "Examination is already submitted or closed." }, { status: 400 });
    }

    if (isAttemptExpired(attempt)) {
      return NextResponse.json({ error: "Examination time has expired." }, { status: 400 });
    }

    const question = db.questions.findById(questionId);
    if (!question || question.examId !== attempt.examId) {
      return NextResponse.json({ error: "Invalid question" }, { status: 400 });
    }

    const exam = db.exams.findById(attempt.examId);
    const marksPerQ = Number(exam?.marksPerQuestion) || 1;
    const negMarks = Number(exam?.negativeMarks) || 0;

    const displayedPosition = attempt.questionOrder.indexOf(questionId) + 1;
    const mapping = attempt.optionOrderMap?.[questionId];
    const normalized = resolveNormalizedOption(selectedAnswer as OptionKey, mapping);

    const isCorrect = normalized ? normalized === question.correctAnswer : false;
    let marksAwarded = 0;
    if (normalized) {
      marksAwarded = isCorrect ? marksPerQ : negMarks > 0 ? -negMarks : 0;
    }

    db.answers.saveAnswer({
      attemptId,
      questionId,
      displayedPosition: displayedPosition > 0 ? displayedPosition : 1,
      selectedAnswer: selectedAnswer || null,
      normalizedAnswer: normalized,
      correctAnswer: question.correctAnswer,
      isCorrect,
      marksAwarded,
      isFlagged: typeof isFlagged === "boolean" ? isFlagged : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save answer" }, { status: 500 });
  }
}
