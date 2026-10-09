import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  try {
    const data = db.resetToSeed();
    await db.saveChanges();
    return NextResponse.json({
      success: true,
      message: "Database successfully reset with demo administrator, exams, questions, and sample student attempts.",
      summary: {
        admins: data.admins.length,
        exams: data.exams.length,
        questions: data.questions.length,
        students: data.students.length,
        attempts: data.examAttempts.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to reset seed data" }, { status: 500 });
  }
}
