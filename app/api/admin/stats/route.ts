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

    const exams = db.exams.getAll();
    const students = db.students.getAll();
    const attempts = db.attempts.getAll();

    const submittedAttempts = attempts.filter((a) => a.status === "submitted" || a.status === "expired");

    const totalScores = submittedAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
    const averageScore = submittedAttempts.length > 0 ? Math.round((totalScores / submittedAttempts.length) * 10) / 10 : 0;

    const highestScore =
      submittedAttempts.length > 0 ? Math.max(...submittedAttempts.map((a) => a.marksObtained)) : 0;

    const recentAttempts = submittedAttempts
      .sort((a, b) => new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime())
      .slice(0, 6)
      .map((att) => {
        const student = db.students.findById(att.studentId);
        const exam = db.exams.findById(att.examId);
        return {
          id: att.id,
          studentName: student?.name || "Unknown",
          rollNumber: student?.rollNumber || "N/A",
          division: student?.division || "N/A",
          examTitle: exam?.title || "Unknown Exam",
          marksObtained: att.marksObtained,
          totalPossibleMarks: att.totalPossibleMarks,
          percentage: att.percentage,
          submittedAt: att.submittedAt || att.createdAt,
          status: att.status,
        };
      });

    return NextResponse.json({
      stats: {
        totalExams: exams.length,
        activeExams: exams.filter((e) => e.status === "active").length,
        totalStudents: students.length,
        totalAttempts: attempts.length,
        completedTests: submittedAttempts.length,
        averageScore,
        highestScore,
      },
      recentAttempts,
      isCloudConnected: db.isCloudConnected(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch stats" }, { status: 500 });
  }
}
