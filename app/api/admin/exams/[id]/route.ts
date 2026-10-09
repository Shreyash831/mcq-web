import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exam = db.exams.findById(params.id);
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const questions = db.questions.getByExamId(params.id);
    const attempts = db.attempts.getAll().filter((a) => a.examId === params.id);

    return NextResponse.json({ exam, questionsCount: questions.length, attemptsCount: attempts.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch exam" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updated = db.exams.update(params.id, {
      title: body.title !== undefined ? body.title.trim() : undefined,
      description: body.description !== undefined ? body.description.trim() : undefined,
      subject: body.subject !== undefined ? body.subject.trim() : undefined,
      durationMinutes: body.durationMinutes !== undefined ? Number(body.durationMinutes) : undefined,
      marksPerQuestion: body.marksPerQuestion !== undefined ? Number(body.marksPerQuestion) : undefined,
      negativeMarks: body.negativeMarks !== undefined ? Number(body.negativeMarks) : undefined,
      shuffleQuestions: body.shuffleQuestions !== undefined ? Boolean(body.shuffleQuestions) : undefined,
      shuffleOptions: body.shuffleOptions !== undefined ? Boolean(body.shuffleOptions) : undefined,
      status: body.status !== undefined ? body.status : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, exam: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update exam" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = db.exams.delete(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Exam not found or already deleted" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete exam" }, { status: 500 });
  }
}
