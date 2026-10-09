import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { DetailedAttemptReport, DetailedStudentAnswerView, OptionKey } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.syncFromCloud();

    const attempt = db.attempts.findById(params.id);
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    const student = db.students.findById(attempt.studentId);
    const exam = db.exams.findById(attempt.examId);

    if (!student || !exam) {
      return NextResponse.json({ error: "Student or exam not found" }, { status: 404 });
    }

    const allQuestions = db.questions.getByExamId(exam.id);
    const questionsMap = new Map(allQuestions.map((q) => [q.id, q]));
    const studentAnswers = db.answers.getByAttemptId(attempt.id);
    const answersMap = new Map(studentAnswers.map((a) => [a.questionId, a]));

    const answersReport: DetailedStudentAnswerView[] = [];

    // Audit using the question order that was shown to the student
    attempt.questionOrder.forEach((qId, idx) => {
      const q = questionsMap.get(qId);
      if (!q) return;

      const savedAnswer = answersMap.get(qId);
      const normalizedChoice = savedAnswer?.normalizedAnswer;
      const originalOptions: Record<OptionKey, string> = {
        A: q.optionA,
        B: q.optionB,
        C: q.optionC,
        D: q.optionD,
      };

      const isAnswered = Boolean(normalizedChoice);
      const isCorrect = isAnswered && normalizedChoice === q.correctAnswer;
      const status: "correct" | "incorrect" | "unanswered" = !isAnswered
        ? "unanswered"
        : isCorrect
        ? "correct"
        : "incorrect";

      answersReport.push({
        questionNumber: idx + 1,
        questionId: q.id,
        questionText: q.questionText,
        options: {
          A: q.optionA,
          B: q.optionB,
          C: q.optionC,
          D: q.optionD,
        },
        selectedAnswerKey: normalizedChoice || null,
        selectedAnswerText: normalizedChoice ? originalOptions[normalizedChoice] : undefined,
        correctAnswerKey: q.correctAnswer,
        correctAnswerText: originalOptions[q.correctAnswer],
        isCorrect,
        status,
        marksAwarded: savedAnswer?.marksAwarded || 0,
        answeredAt: savedAnswer?.answeredAt,
      });
    });

    const report: DetailedAttemptReport = {
      attempt,
      student,
      exam,
      answers: answersReport,
    };

    return NextResponse.json({ report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch student profile report" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.syncFromCloud();
    const deleted = db.attempts.delete(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    await db.saveChanges();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete attempt" }, { status: 500 });
  }
}
