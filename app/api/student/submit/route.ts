import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudentSession, STUDENT_COOKIE_NAME } from "@/lib/auth";
import { evaluateAttempt } from "@/lib/exam-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const session = await getStudentSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    await db.syncFromCloud();

    const { attemptId } = await req.json();

    if (!attemptId || session.attemptId !== attemptId) {
      return NextResponse.json({ error: "Unauthorized attempt" }, { status: 403 });
    }

    const attempt = db.attempts.findById(attemptId);
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.status === "submitted" || attempt.status === "expired") {
      return NextResponse.json({
        success: true,
        message: "Your examination has been submitted successfully.",
      });
    }

    const exam = db.exams.findById(attempt.examId);
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const questions = db.questions.getByExamId(exam.id);
    const savedAnswers = db.answers.getByAttemptId(attempt.id);

    // Evaluate strictly on backend
    const scoreResult = evaluateAttempt(exam, attempt, questions, savedAnswers);

    // Save final attempt statistics
    db.attempts.update(attempt.id, {
      status: "submitted",
      submittedAt: new Date().toISOString(),
      totalQuestions: scoreResult.totalQuestions,
      correctAnswers: scoreResult.correctAnswers,
      incorrectAnswers: scoreResult.incorrectAnswers,
      unansweredQuestions: scoreResult.unansweredQuestions,
      marksObtained: scoreResult.marksObtained,
      totalPossibleMarks: scoreResult.totalPossibleMarks,
      percentage: scoreResult.percentage,
    });

    // Save all evaluated question results
    scoreResult.evaluatedAnswers.forEach((ans) => {
      db.answers.saveAnswer({
        attemptId: attempt.id,
        questionId: ans.questionId,
        displayedPosition: ans.displayedPosition,
        selectedAnswer: ans.selectedAnswer,
        normalizedAnswer: ans.normalizedAnswer,
        correctAnswer: ans.correctAnswer,
        isCorrect: ans.isCorrect,
        marksAwarded: ans.marksAwarded,
        isFlagged: ans.isFlagged,
      });
    });

    await db.saveChanges();

    // Clear session cookie so student cannot re-enter active exam mode
    const response = NextResponse.json({
      success: true,
      message: "Your examination has been submitted successfully.",
    });

    response.cookies.delete(STUDENT_COOKIE_NAME);

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit examination" }, { status: 500 });
  }
}
