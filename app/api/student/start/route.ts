import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createStudentToken, STUDENT_COOKIE_NAME } from "@/lib/auth";
import { shuffleArray, generateOptionMapping } from "@/lib/exam-engine";
import { OptionMapping } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    await db.syncFromCloud();

    const { name, rollNumber, division, email, examId } = await req.json();

    const trimmedName = (name || "").trim();
    const trimmedRoll = (rollNumber || "").trim();
    const trimmedDiv = (division || "").trim().toUpperCase();
    const trimmedEmail = (email || "").trim().toLowerCase();

    if (!trimmedName || !trimmedRoll || !trimmedDiv || !examId) {
      return NextResponse.json(
        { error: "Full Name, Roll Number, Division, and Examination are required." },
        { status: 400 }
      );
    }

    if (!trimmedEmail) {
      return NextResponse.json(
        { error: "Email Address is required to register for the examination." },
        { status: 400 }
      );
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const exam = db.exams.findById(examId);
    if (!exam || exam.status !== "active") {
      return NextResponse.json({ error: "Selected examination is not currently active." }, { status: 404 });
    }

    const questions = db.questions.getByExamId(examId);
    if (questions.length === 0) {
      return NextResponse.json(
        { error: "This examination has no questions uploaded yet. Please contact the administrator." },
        { status: 400 }
      );
    }

    // Strict uniqueness check: Name and Email must not be repeated
    const existingByName = db.students.findByName(trimmedName);
    const existingByEmail = db.students.findByEmail(trimmedEmail);
    const existingByRollDiv = db.students.findByRollAndDivision(trimmedRoll, trimmedDiv);

    // 1. Verify Name Uniqueness
    if (existingByName) {
      const attempt = db.attempts.findByStudentAndExam(existingByName.id, examId);
      const isSameStudent =
        (existingByName.email || "").toLowerCase() === trimmedEmail &&
        existingByName.rollNumber.toLowerCase() === trimmedRoll.toLowerCase() &&
        existingByName.division.toUpperCase() === trimmedDiv;

      if (!isSameStudent || (attempt && (attempt.status === "submitted" || attempt.status === "expired"))) {
        return NextResponse.json(
          {
            error: `The student name "${trimmedName}" has already registered or completed the test. Names cannot be repeated; please provide a distinct name.`,
          },
          { status: 409 }
        );
      }
    }

    // 2. Verify Email Uniqueness
    if (existingByEmail) {
      if (!existingByName || existingByEmail.id !== existingByName.id) {
        return NextResponse.json(
          {
            error: `The email address "${trimmedEmail}" is already registered. Emails cannot be repeated; please provide a distinct email address.`,
          },
          { status: 409 }
        );
      }
    }

    // 3. Verify Roll Number & Division conflict
    if (existingByRollDiv) {
      if (
        existingByRollDiv.name.toLowerCase() !== trimmedName.toLowerCase() ||
        (existingByRollDiv.email && existingByRollDiv.email.toLowerCase() !== trimmedEmail)
      ) {
        return NextResponse.json(
          {
            error: `Roll Number "${trimmedRoll}" (Div ${trimmedDiv}) is already assigned to "${existingByRollDiv.name}". Please check your details or use a different roll number.`,
          },
          { status: 409 }
        );
      }
    }

    // Get or create student record
    let student = existingByName || existingByEmail || existingByRollDiv;
    if (!student) {
      student = db.students.create({
        name: trimmedName,
        rollNumber: trimmedRoll,
        division: trimmedDiv,
        email: trimmedEmail,
      });
    }

    // Check for existing attempt
    const existingAttempt = db.attempts.findByStudentAndExam(student.id, examId);

    if (existingAttempt) {
      if (existingAttempt.status === "submitted" || existingAttempt.status === "expired") {
        return NextResponse.json(
          {
            error: "You have already submitted this examination. Duplicate attempts are not permitted.",
            alreadySubmitted: true,
          },
          { status: 403 }
        );
      }

      await db.saveChanges();

      // Resume existing in-progress attempt
      const token = await createStudentToken({
        studentId: student.id,
        attemptId: existingAttempt.id,
        examId: exam.id,
        rollNumber: student.rollNumber,
        division: student.division,
      });

      const response = NextResponse.json({
        success: true,
        attemptId: existingAttempt.id,
        resumed: true,
      });

      response.cookies.set({
        name: STUDENT_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 12,
      });

      return response;
    }

    // Build randomized question order
    let questionIds = questions.map((q) => q.id);
    if (exam.shuffleQuestions) {
      questionIds = shuffleArray(questionIds);
    }

    // Build randomized option mappings if enabled
    let optionOrderMap: Record<string, OptionMapping> | undefined;
    if (exam.shuffleOptions) {
      optionOrderMap = {};
      questions.forEach((q) => {
        optionOrderMap![q.id] = generateOptionMapping();
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + exam.durationMinutes * 60 * 1000);

    // Create attempt
    const newAttempt = db.attempts.create({
      examId: exam.id,
      studentId: student.id,
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: "in_progress",
      totalQuestions: questionIds.length,
      correctAnswers: 0,
      incorrectAnswers: 0,
      unansweredQuestions: questionIds.length,
      marksObtained: 0,
      totalPossibleMarks: questionIds.length * exam.marksPerQuestion,
      percentage: 0,
      questionOrder: questionIds,
      optionOrderMap,
    });

    await db.saveChanges();

    const token = await createStudentToken({
      studentId: student.id,
      attemptId: newAttempt.id,
      examId: exam.id,
      rollNumber: student.rollNumber,
      division: student.division,
    });

    const response = NextResponse.json({
      success: true,
      attemptId: newAttempt.id,
      resumed: false,
    });

    response.cookies.set({
      name: STUDENT_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to start examination" }, { status: 500 });
  }
}
