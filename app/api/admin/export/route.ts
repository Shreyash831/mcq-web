import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { exportResultsToCsv } from "@/lib/excel";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");

    const attempts = db.attempts.getAll();
    const students = db.students.getAll();
    const exams = db.exams.getAll();

    const studentMap = new Map(students.map((s) => [s.id, s]));
    const examMap = new Map(exams.map((e) => [e.id, e]));

    let targetAttempts = attempts.filter((a) => a.status === "submitted" || a.status === "expired");
    if (examId) {
      targetAttempts = targetAttempts.filter((a) => a.examId === examId);
    }

    const exportRows = targetAttempts.map((att) => {
      const student = studentMap.get(att.studentId);
      const exam = examMap.get(att.examId);
      return {
        studentName: student?.name || "Unknown",
        rollNumber: student?.rollNumber || "N/A",
        division: student?.division || "N/A",
        examTitle: exam?.title || "Unknown Exam",
        status: att.status,
        totalQuestions: att.totalQuestions,
        correctAnswers: att.correctAnswers,
        incorrectAnswers: att.incorrectAnswers,
        unansweredQuestions: att.unansweredQuestions,
        marksObtained: att.marksObtained,
        totalPossibleMarks: att.totalPossibleMarks,
        percentage: att.percentage,
        submittedAt: att.submittedAt || att.createdAt,
      };
    });

    const csvData = exportResultsToCsv(exportRows);

    return new NextResponse(csvData, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="examination_results_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to export results" }, { status: 500 });
  }
}
