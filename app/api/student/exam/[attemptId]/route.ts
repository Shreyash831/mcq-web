import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudentSession } from "@/lib/auth";
import { sanitizeQuestionForStudent, isAttemptExpired, getRemainingSeconds, evaluateAttempt } from "@/lib/exam-engine";
import { StudentExamSession, SanitizedQuestion } from "@/types";

export async function GET(req: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    const { attemptId } = params;
    const session = await getStudentSession(req);

    if (!session || session.attemptId !== attemptId) {
      return NextResponse.json({ error: "Unauthorized access to this examination attempt." }, { status: 401 });
    }

    const attempt = db.attempts.findById(attemptId);
    if (!attempt) {
      return NextResponse.json({ error: "Examination attempt not found." }, { status: 404 });
    }

    const student = db.students.findById(attempt.studentId);
    const exam = db.exams.findById(attempt.examId);

    if (!student || !exam) {
      return NextResponse.json({ error: "Invalid examination metadata." }, { status: 500 });
    }

    // If already submitted
    if (attempt.status === "submitted" || attempt.status === "expired") {
      return NextResponse.json({
        isSubmitted: true,
        message: "Your examination has already been submitted.",
      });
    }

    // Check if time expired
    if (isAttemptExpired(attempt)) {
      // Auto-submit server-side
      const allQuestions = db.questions.getByExamId(exam.id);
      const savedAnswers = db.answers.getByAttemptId(attempt.id);
      const scoreResult = evaluateAttempt(exam, attempt, allQuestions, savedAnswers);

      db.attempts.update(attempt.id, {
        status: "expired",
        submittedAt: new Date().toISOString(),
        totalQuestions: scoreResult.totalQuestions,
        correctAnswers: scoreResult.correctAnswers,
        incorrectAnswers: scoreResult.incorrectAnswers,
        unansweredQuestions: scoreResult.unansweredQuestions,
        marksObtained: scoreResult.marksObtained,
        totalPossibleMarks: scoreResult.totalPossibleMarks,
        percentage: scoreResult.percentage,
      });

      // Update question-level answers
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

      return NextResponse.json({
        isSubmitted: true,
        message: "Time has expired. Your examination has been automatically submitted.",
      });
    }

    // Fetch questions in randomized order
    const allQuestions = db.questions.getByExamId(exam.id);
    const questionsMap = new Map(allQuestions.map((q) => [q.id, q]));
    const savedAnswers = db.answers.getByAttemptId(attempt.id);
    const savedAnswersMap = new Map(savedAnswers.map((a) => [a.questionId, a]));

    const sanitizedQuestions: SanitizedQuestion[] = [];

    attempt.questionOrder.forEach((qId, idx) => {
      const q = questionsMap.get(qId);
      if (q) {
        const mapping = attempt.optionOrderMap?.[q.id];
        const saved = savedAnswersMap.get(q.id);
        const sanitized = sanitizeQuestionForStudent(q, idx + 1, mapping, {
          selectedAnswer: saved?.selectedAnswer,
          isFlagged: saved?.isFlagged,
        });
        sanitizedQuestions.push(sanitized);
      }
    });

    const responsePayload: StudentExamSession = {
      attemptId: attempt.id,
      examId: exam.id,
      examTitle: exam.title,
      subject: exam.subject,
      durationMinutes: exam.durationMinutes,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      remainingSeconds: getRemainingSeconds(attempt),
      student: {
        name: student.name,
        rollNumber: student.rollNumber,
        division: student.division,
      },
      totalQuestions: sanitizedQuestions.length,
      questions: sanitizedQuestions,
    };

    return NextResponse.json({ session: responsePayload });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load examination" }, { status: 500 });
  }
}
