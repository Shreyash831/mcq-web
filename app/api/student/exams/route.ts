import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await db.syncFromCloud();
    const allExams = db.exams.getAll();
    const activeExams = allExams
      .filter((e) => e.status === "active")
      .map((e) => ({
        id: e.id,
        title: e.title,
        subject: e.subject,
        description: e.description,
        durationMinutes: e.durationMinutes,
        totalQuestions: e.totalQuestions,
        marksPerQuestion: e.marksPerQuestion,
        negativeMarks: e.negativeMarks,
      }));

    return NextResponse.json({ exams: activeExams });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch exams" }, { status: 500 });
  }
}
