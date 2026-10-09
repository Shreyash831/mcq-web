import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.syncFromCloud();

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const division = searchParams.get("division");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const allAttempts = db.attempts.getAll();
    const students = db.students.getAll();
    const exams = db.exams.getAll();

    const studentMap = new Map(students.map((s) => [s.id, s]));
    const examMap = new Map(exams.map((e) => [e.id, e]));

    let results = allAttempts.map((attempt) => {
      const student = studentMap.get(attempt.studentId);
      const exam = examMap.get(attempt.examId);
      return {
        id: attempt.id,
        attemptId: attempt.id,
        studentId: attempt.studentId,
        studentName: student?.name || "Unknown",
        rollNumber: student?.rollNumber || "N/A",
        division: student?.division || "N/A",
        email: student?.email || "",
        examId: attempt.examId,
        examTitle: exam?.title || "Unknown Exam",
        subject: exam?.subject || "N/A",
        status: attempt.status,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: attempt.correctAnswers,
        incorrectAnswers: attempt.incorrectAnswers,
        unansweredQuestions: attempt.unansweredQuestions,
        marksObtained: attempt.marksObtained,
        totalPossibleMarks: attempt.totalPossibleMarks,
        percentage: attempt.percentage,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt || null,
        createdAt: attempt.createdAt,
      };
    });

    // Filters
    if (examId) {
      results = results.filter((r) => r.examId === examId);
    }
    if (division) {
      results = results.filter((r) => r.division.toLowerCase() === division.toLowerCase());
    }
    if (status) {
      results = results.filter((r) => r.status === status);
    }
    if (search) {
      results = results.filter(
        (r) =>
          r.studentName.toLowerCase().includes(search) ||
          r.rollNumber.toLowerCase().includes(search) ||
          r.division.toLowerCase().includes(search) ||
          r.examTitle.toLowerCase().includes(search)
      );
    }

    // Sorting
    results.sort((a, b) => {
      let valA: any = a.submittedAt || a.createdAt;
      let valB: any = b.submittedAt || b.createdAt;

      if (sortBy === "marks") {
        valA = a.marksObtained;
        valB = b.marksObtained;
      } else if (sortBy === "percentage") {
        valA = a.percentage;
        valB = b.percentage;
      } else if (sortBy === "name") {
        valA = a.studentName.toLowerCase();
        valB = b.studentName.toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return NextResponse.json({ attempts: results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch student attempts" }, { status: 500 });
  }
}
